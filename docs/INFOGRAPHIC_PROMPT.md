# Infographic Prompt for Google Gemini

## Prompt for Gemini

Create a professional infographic for an AWS Security Assessment of a serverless quiz application. Use a modern, clean design with AWS brand colors (orange #FF9900, dark blue #232F3E, light blue #00A8E1).

---

## Title Section
**"AWS Security Assessment: Serverless Application"**
Subtitle: "Exam Readiness Tracker - CIS Benchmark Compliance Review"

---

## Section 1: Application Architecture (Top)
Create a simple architecture diagram showing:
- User Browser → AWS Amplify (Frontend)
- AWS Amplify → AWS AppSync (GraphQL API)
- AWS AppSync → AWS Lambda (Business Logic)
- AWS Lambda → MongoDB Atlas (Database)
- AWS Cognito (Authentication) connecting to AppSync

Use icons for each service and arrows showing data flow.

---

## Section 2: Assessment Framework (Left Side)
**"Assessment Methodology"**

Show 3 pillars with icons:
1. **CIS AWS Foundations Benchmark v1.5.0**
   - Industry standard compliance framework
   - 13 controls evaluated

2. **AWS Security Tools**
   - Security Hub
   - Inspector
   - CloudTrail
   - GuardDuty
   - CodeGuru

3. **Best Practices Review**
   - OWASP Top 10
   - AWS Well-Architected Framework
   - Secure coding standards

---

## Section 3: Security Assessment Process (Center)
**"4-Phase Assessment Process"**

Create a circular or linear flow diagram:

**Phase 1: Discovery** (Icon: Magnifying glass)
- Architecture review
- Resource inventory
- Configuration analysis

**Phase 2: Analysis** (Icon: Shield with checkmark)
- Vulnerability scanning
- Code review
- Compliance mapping

**Phase 3: Testing** (Icon: Target/bullseye)
- Penetration testing
- Security tool deployment
- Validation testing

**Phase 4: Reporting** (Icon: Document/clipboard)
- Findings documentation
- Risk prioritization
- Remediation roadmap

---

## Section 4: Key Findings Summary (Right Side)
**"Security Findings Overview"**

Create a dashboard-style layout with:

**Risk Distribution** (Pie chart or donut chart):
- Critical: 0 (Green)
- High: 3 (Red)
- Medium: 5 (Orange)
- Low: 4 (Yellow)
- Informational: 6 (Blue)

**Total Findings: 18**

---

## Section 5: Top 3 Critical Areas (Bottom Left)
**"Priority Remediation Areas"**

Use numbered badges (1, 2, 3) with icons:

**1. Logging & Monitoring** (Icon: Eye/monitor)
- CloudTrail not enabled
- No CloudWatch alarms
- Risk: Cannot detect security incidents

**2. Access Control** (Icon: Lock/key)
- MFA not enforced
- Hardcoded admin role
- Risk: Unauthorized access

**3. Vulnerability Management** (Icon: Bug/shield)
- No dependency scanning
- No automated security testing
- Risk: Exploitable vulnerabilities

---

## Section 6: AWS Security Tools Recommended (Bottom Center)
**"Recommended AWS Security Stack"**

Create a grid of tool cards with icons:

**Detection & Response:**
- AWS Security Hub (Central dashboard)
- Amazon GuardDuty (Threat detection)
- AWS CloudTrail (Audit logging)

**Prevention:**
- AWS WAF (Web firewall)
- AWS Inspector (Vulnerability scanning)
- Amazon CodeGuru (Code security)

**Compliance:**
- AWS Config (Configuration compliance)
- AWS Trusted Advisor (Best practices)

---

## Section 7: Compliance Status (Bottom Right)
**"CIS Benchmark Compliance"**

Create a progress bar or gauge chart:
- **Compliant:** 35% (Green section)
- **Partial:** 40% (Yellow section)
- **Non-Compliant:** 25% (Red section)

Show key metrics:
- ✅ 5 Controls Passed
- ⚠️ 6 Controls Partial
- ❌ 2 Controls Failed

---

## Section 8: Remediation Timeline (Bottom)
**"3-Phase Remediation Roadmap"**

Create a horizontal timeline with milestones:

**Phase 1: Immediate (0-30 days)**
- Enable CloudTrail
- Configure CloudWatch alarms
- Update dependencies
- Enable MFA

**Phase 2: Short-term (30-90 days)**
- Implement RBAC
- Deploy Lambda in VPC
- Enable Security Hub
- Input validation

**Phase 3: Long-term (90-180 days)**
- Secret rotation
- Penetration testing
- Automated scanning
- Backup procedures

---

## Design Guidelines:
1. Use AWS official colors and modern flat design
2. Include AWS service icons (use official AWS architecture icons)
3. Make it suitable for presentation slides (16:9 aspect ratio)
4. Use clear, readable fonts (minimum 12pt for body text)
5. Include a footer with: "Assessment Date: December 2024 | Framework: CIS AWS Foundations Benchmark v1.5.0"
6. Add subtle gradients and shadows for depth
7. Use consistent spacing and alignment
8. Include a legend for risk levels (Critical/High/Medium/Low)

---

## Color Palette:
- Primary: AWS Orange (#FF9900)
- Secondary: AWS Dark Blue (#232F3E)
- Accent: AWS Light Blue (#00A8E1)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Background: White (#FFFFFF) or Light Gray (#F3F4F6)

---

## Output Format:
Create a single-page infographic that can be:
- Printed on 11x17 paper
- Displayed on a presentation screen
- Shared as a PDF or PNG
- Used in security reports

Make it visually engaging, professional, and easy to understand for both technical and non-technical audiences.
