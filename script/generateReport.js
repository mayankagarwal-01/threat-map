const PDFDocument = require('pdfkit');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { WritableStreamBuffer } = require('stream-buffers');
const s3 = new S3Client({ region: 'ap-south-1' });
const dynamo = new DynamoDBClient({ region: 'ap-south-1' });

exports.handler = async (event) => {
  const data = JSON.parse(event.body); // or event directly if not using API Gateway
  
  // Extract query parameters if available
  const queryParams = event.queryStringParameters || {};
  const reportType = queryParams.id || 'threat_type';

  const BUCKET_NAME = process.env.BUCKET_NAME;
  const TABLE_NAME = process.env.TABLE_NAME;

  const doc = new PDFDocument();
  const bufferWriter = new WritableStreamBuffer();

  doc.pipe(bufferWriter);

  // Title
  doc.fontSize(20).text('EMAIL THREAT REPORT', { align: 'center' }).moveDown();

  // Metadata
  if (reportType === 'default' || reportType === 'sender') {
    doc.fontSize(12).text(`Sender: ${data[0].from}`);
  }
  
  doc.fontSize(12).text(`Date: ${new Date().toUTCString()}`);
  
  // Add report type information if specialized report
  if (reportType === 'threat_type' || reportType === 'activity') {
    doc.text(`Report Type: ${reportType === 'threat_type' ? 'Threat Type Analysis' : 'Activity Analysis'}`);
  }
  doc.moveDown();

  // Define consistent styling
  const styles = {
    header: {
      fontSize: 16,
      color: '#333333',
      underline: true
    },
    subheader: {
      fontSize: 14,
      color: '#555555'
    },
    normal: {
      fontSize: 12,
      color: '#000000'
    },
    detail: {
      fontSize: 11,
      color: '#444444',
      font: 'Times-Roman'
    },
    spacing: {
      sectionGap: 1.5,
      afterHeader: 0.8,
      afterField: 0.3,
      afterList: 0.5
    }
  };

  // Iterate over threats
  data.forEach((item, index) => {
    // Process remarks to create an array of bullet points
    const remarksArray = item.remarks ? item.remarks.split('&&&').map(remark => remark.trim()).filter(remark => remark) : ['N/A'];
    const ipList = item.suspect_ip
      ? item.suspect_ip.split(',').map(ip => ip.trim())
      : ['N/A'];
    
    // Add page break if not the first item and close to page end
    if (index > 0 && doc.y > 650) {
      doc.addPage();
    }
    
    // Add header with campaign name
    doc.font('Helvetica-Bold')
       .fontSize(styles.header.fontSize)
       .fillColor(styles.header.color)
       .text(`Threat Report #${index + 1}: ${item.campaign}`, {
          underline: styles.header.underline
       })
       .moveDown(styles.spacing.afterHeader);

    // Create a consistent left margin
    const leftMargin = 10;
    
    // Add threat details using a consistent structure
    doc.font('Helvetica')
       .fontSize(styles.normal.fontSize)
       .fillColor(styles.normal.color);
    
    // Main threat information in a cleaner format
    const threatInfo = [
      { label: 'Threat Severity', value: item.type },
      { label: 'Status', value: item.isActive ? 'Active' : 'Inactive' },
      { label: 'Date Received', value: item.date ? new Date(item.date).toLocaleString() : 'Unknown' }
    ];
    
    // Add sender information for threat_type or activity reports
    if (reportType === 'threat_type' || reportType === 'activity') {
      threatInfo.push({ label: 'Sender', value: item.from || 'Unknown' });
    }
    
    threatInfo.forEach(info => {
      doc.text(`${info.label}: `, {
        continued: true
      }).font('Helvetica-Bold').text(info.value).font('Helvetica').moveDown(styles.spacing.afterField);
    });
    
    // IP addresses section
    doc.text('Suspected IP Addresses:').moveDown(styles.spacing.afterField);
    
    if (ipList.length > 0 && ipList[0] !== 'N/A') {
      ipList.forEach(ip => {
        doc.text(`• ${ip}`, {
          indent: leftMargin
        });
      });
    } else {
      doc.text('None identified', {
        indent: leftMargin
      });
    }
    doc.moveDown(styles.spacing.afterList);
    
    // Remarks section
    doc.text('Remarks:').moveDown(styles.spacing.afterField);
    
    if (remarksArray.length > 0 && remarksArray[0] !== 'N/A') {
      remarksArray.forEach(remark => {
        doc.text(`• ${remark}`, {
          indent: leftMargin
        });
      });
    } else {
      doc.text('None provided', {
        indent: leftMargin
      });
    }
    doc.moveDown(styles.spacing.afterList);
    
    // Summary section (if available)
    if (item.summary) {
      doc.text('Summary:').moveDown(styles.spacing.afterField);
      doc.font(styles.detail.font)
         .fontSize(styles.detail.fontSize)
         .fillColor(styles.detail.color)
         .text(item.summary, {
           indent: leftMargin,
           align: 'justify'
         });
    }
    
    // Add space between threat entries
    doc.moveDown(styles.spacing.sectionGap);
  });

  // Finalize the document
  doc.end();

  await new Promise(resolve => doc.on('end', resolve));
  const pdfBuffer = bufferWriter.getContents();
  
  // Generate a more descriptive filename based on the report type
  let reportPrefix = 'report';
  if (reportType === 'threat_type') {
    reportPrefix = 'threat_analysis';
  } else if (reportType === 'activity') {
    reportPrefix = 'activity_analysis';
  } else if (reportType === 'sender') {
    reportPrefix = 'sender_report';
  }
  
  const report_name = `${reportPrefix}_${Date.now()}.pdf`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `reports/${report_name}`,
    Body: pdfBuffer,
    ContentType: 'application/pdf'
  }));
      
  await dynamo.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        s3Key: { S: `reports/${report_name}` }
      }
  }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="report.pdf"'
    }
  };
};