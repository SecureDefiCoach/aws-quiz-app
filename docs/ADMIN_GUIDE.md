# Admin Guide - Exam Readiness Tracker (ERT)

## Overview

As an administrator, you have access to user management features and system maintenance tools. This guide covers common admin tasks and best practices.

---

## Accessing the Admin Panel

1. Log in with your admin account (`tristanmarvin@outlook.com`)
2. Click the "Admin" button in the navigation (only visible to admins)
3. You'll see two tabs: "Pending Approvals" and "All Users"

---

## Managing Users

### Viewing Users

**Pending Approvals Tab:**
- Shows users who have signed up and verified their email
- Displays email, status, and creation date
- Currently, all users are auto-confirmed, so this tab may be empty

**All Users Tab:**
- Shows all registered users
- Displays email, status (CONFIRMED, UNCONFIRMED, etc.), and creation date
- Sorted by creation date

### Deleting Users

1. Find the user in either tab
2. Click the "Delete" button next to their email
3. Confirm the deletion
4. User account is permanently removed from Cognito
5. **Note:** User's quiz progress remains in MongoDB (tied to their user ID)

**When to delete users:**
- Spam/fake accounts
- User requests account deletion
- Duplicate accounts
- Testing accounts

### Approving Users (Future Feature)

Currently, users are auto-approved after email verification. In the future, you may enable manual approval where users must wait for admin confirmation.

---

## Importing New Exams

### Prerequisites

- CSV file with questions in the correct format
- Questions prepared with domain/subdomain classifications
- Explanations for each answer

### CSV Format

Required columns:
- `question` - Question text
- `option A` through `option F` - Answer options (A-D required, E-F optional)
- `answer` - Correct answer(s), e.g., "A" or "A,B" for multi-answer
- `_Explanation` - Why the answer is correct
- `_ExamNumber` - Exam identifier (e.g., "SCS-C02", "ISACA-AI")
- `_ExamName` - Full exam name (e.g., "AWS Certified Security - Specialty")
- `_SubDomainNum` - Subdomain number (e.g., "1.2")
- `_SubDomainName` - Subdomain name (e.g., "Detection & Investigation")
- `_OriginalNumber` - Original question number from source material

### Import Process

1. **Prepare CSV file:**
   - Export from Google Sheets or Excel
   - Save as UTF-8 encoded CSV
   - Place in `data/` folder

2. **Run import script:**
   ```bash
   cd /path/to/aws-quiz-app
   npm run db:seed
   ```

3. **Verify import:**
   - Check terminal output for success/error messages
   - Log in to the app and check if new exam appears in dropdown
   - Start a quiz to verify questions load correctly

4. **Test questions:**
   - Answer a few questions to ensure:
     - Options display correctly
     - Correct answers are marked properly
     - Explanations show up
     - Progress tracking works

### Import Modes (Future Feature)

- **Append mode** - Add new questions without deleting existing ones
- **Replace mode** - Replace all questions for a specific exam
- **Dry-run mode** - Validate CSV without importing

---

## Monitoring User Activity

### CloudWatch Logs

View Lambda function logs to monitor system activity:

```bash
# View recent logs
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short

# Follow logs in real-time
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --follow

# Search for errors
aws logs tail /aws/lambda/amplify-frontend-tristanm-mongoconnectorlambdaF299-HM7aLYf5eELO --since 1h --format short | grep ERROR
```

### Key Metrics to Monitor

- **User signups** - Track new registrations
- **Quiz sessions** - How many quizzes are being taken
- **Error rates** - Lambda errors or database connection issues
- **Response times** - Slow queries or performance issues

### Using the Admin Script

List all users via command line:

```bash
./scripts/manage-users.sh list
```

List pending users:

```bash
./scripts/manage-users.sh pending
```

Confirm a user:

```bash
./scripts/manage-users.sh confirm user@example.com
```

Delete a user:

```bash
./scripts/manage-users.sh delete user@example.com
```

---

## Database Management

### MongoDB Atlas Access

1. Log in to MongoDB Atlas
2. Navigate to your cluster
3. Click "Browse Collections"
4. View data in:
   - `questions` - All quiz questions
   - `userProgress` - User progress tracking
   - `quizSessions` - Active quiz sessions (auto-expire after 24 hours)

### Backup Strategy

**Recommended:**
- MongoDB Atlas automatic backups (enabled by default on paid tiers)
- Export questions collection periodically:
  ```bash
  mongoexport --uri="mongodb+srv://..." --collection=questions --out=questions-backup.json
  ```

### Data Cleanup

**Quiz sessions** auto-expire after 24 hours (TTL index).

**User progress** persists indefinitely. To clean up:
- Delete progress for deleted users (manual MongoDB query)
- Archive old data if needed

---

## Deployment

### Deploying Updates

1. Make changes locally
2. Test in sandbox:
   ```bash
   cd front-end
   npx ampx sandbox
   ```

3. Commit and push to production:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

4. Monitor deployment in AWS Amplify Console
5. Test production site after deployment

### Rollback

If deployment fails or introduces bugs:

1. Go to AWS Amplify Console
2. Find the last working deployment
3. Click "Redeploy this version"

---

## Security Best Practices

1. **Never share admin credentials**
2. **Use strong passwords** (password manager recommended)
3. **Monitor user activity** for suspicious behavior
4. **Keep MongoDB credentials secure** (stored in AWS Secrets Manager)
5. **Review CloudWatch logs regularly** for errors or attacks
6. **Update dependencies** periodically for security patches

---

## Common Admin Tasks

### Adding a New Admin

Currently, only `tristanmarvin@outlook.com` is hardcoded as admin. To add another admin:

1. Update `ADMIN_EMAIL` in `front-end/amplify/functions/mongo-connector/services/adminService.ts`
2. Or implement a database-driven admin role system (future enhancement)

### Changing Verification Email

Edit `front-end/amplify/auth/resource.ts`:

```typescript
verificationEmailSubject: 'Your custom subject',
verificationEmailBody: (createCode) => 
  `Your custom message with code: ${createCode()}`,
```

### Updating Question Content

1. Export questions from MongoDB
2. Edit in spreadsheet
3. Re-import using import script
4. **Note:** This will update question text but preserve user progress (matched by question ID)

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed troubleshooting steps.

**Quick fixes:**

- **Admin panel not loading** - Check CloudWatch logs for Lambda errors
- **Users can't sign up** - Verify Cognito user pool is active
- **Questions not importing** - Check CSV format and MongoDB connection
- **Slow performance** - Check MongoDB Atlas metrics and Lambda memory settings

---

## Support

For technical issues beyond this guide, refer to:
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Monitoring Guide](./MONITORING.md)
- AWS Amplify documentation
- MongoDB Atlas documentation

---

## Future Enhancements

Planned admin features:
- Exam access control per user
- Bulk user management
- Analytics dashboard
- Question import via web UI
- User activity reports
- Automated backups

---

**Last Updated:** December 2024
