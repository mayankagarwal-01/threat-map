# 🛡️ Threat Map by NEEPCO – Intelligence-Based Threat Monitoring System

A secure, scalable, and AI-powered email threat intelligence dashboard developed for the North Eastern Electric Power Corporation (NEEPCO). This cloud-native application automates the ingestion, classification, and triage of threat intelligence received via government emails, enhancing cybersecurity visibility and operational readiness.

---

## 🎯 Objectives

- Automate the **classification of email-based threats** using LLMs (Large Language Models).
- Centralize threat intelligence from various government bodies into a **single analyst dashboard**.
- Provide **structured metadata extraction** (sender, campaign, summary, IPs, timestamps).
- Enable **auditable analyst workflows** with threat review, status updates, and remarks.
- Support **compliance and reporting** needs via PDF generation and threat logs.
- Deliver **role-based access control** using AWS Cognito (Analyst vs Admin).

---

## 🌟 Key Features

- **📥 Intelligence Ingestion:** Poll, extract, and process threat emails using LLMs.
- **📊 Central Dashboard:** View, filter, sort, and search threat entries by severity, sender, campaign, and date.
- **🗂️ Threat Review Panel:** Mark threats active/inactive, add remarks, track changes with full audit trails.
- **📝 Report Generation:** Filter threats and export detailed reports in PDF format for compliance.
- **🛠️ Admin Panel:** Manage users, roles, and approved email senders with secure authentication.
- **🔐 Secure Auth & RBAC:** AWS Cognito for login, role checks, and JWT-based authorization.
- **🧠 LLM-Powered Classification:** Automated urgency tagging and metadata extraction.

---

## 🏗️ Architecture Overview

Built entirely on **AWS serverless technologies**:

- **Frontend:** JavaScript (SPA), HTML/CSS, modular JS (`index.js`, `reports.js`, `admin.js`)
- **Auth & Roles:** AWS Cognito (User Pools, Hosted UI, JWT Tokens)
- **API Layer:** AWS API Gateway (REST endpoints with Cognito authorizer)
- **Backend Logic:** AWS Lambda (data fetch, classification, report generation)
- **Data Storage:** Amazon DynamoDB (email metadata, users, reports, senders)
- **File Storage:** Amazon S3 (report PDFs, attachments)

---

## 🧰 Prerequisites

To run this project, you need:

- AWS account with the following services set up:
  - Cognito User Pool (with Admin and Analyst groups)
  - API Gateway and Lambda functions deployed
  - DynamoDB tables: `email_metadata`, `reports`, `senders`
  - S3 bucket for storing reports
- AWS CLI configured locally
- Node.js installed (for backend Lambda packaging or frontend logic if needed)
- A browser to run the frontend HTML files (served locally or via S3)

---

## 🧪 Sample Threat Record (email_metadata)

```json
{
  "emailUid": "abc123",
  "from": "gov-alert@xyz.gov",
  "date": "2025-06-25",
  "campaign": "APT-DragonFly",
  "type": "High",
  "summary": "Activity linked to suspected phishing against energy sector",
  "suspect_ip": "192.0.2.1",
  "remarks": "Initial scan complete. Under review.",
  "isActive": true,
  "s3Key": "emails/email_abc123.txt"
}
