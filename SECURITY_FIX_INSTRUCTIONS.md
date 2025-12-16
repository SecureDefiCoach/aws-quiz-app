# 🚨 URGENT: MongoDB Credentials Security Fix

## Step 1: Create Secret in AWS Secrets Manager (Manual)

1. **Go to AWS Console** → Secrets Manager (us-east-1 region)
2. **Click "Store a new secret"**
3. **Select "Other type of secret"**
4. **Key/Value pairs:**
   - Key: `MONGO_URI`
   - Value: `mongodb+srv://aemjk4h_db_user:ccnP2007@TristanMarvin.ludle3b.mongodb.net/`
5. **Secret name:** `MONGO_URI`
6. **Description:** `MongoDB Atlas connection string for AWS Quiz App`
7. **Click "Store"**

## Step 2: Update MongoDB Atlas Password

1. **Go to MongoDB Atlas Dashboard**
2. **Database Access** → Find user `aemjk4h_db_user`
3. **Edit** → **Change Password** → Generate new secure password
4. **Update the secret in AWS Secrets Manager** with new connection string

## Step 3: Test the Application

1. **Deploy the updated backend role policy**
2. **Test the production app** at https://main.d1x14awbpsjxh2.amplifyapp.com/
3. **Verify demo mode works** (tests MongoDB connection)
4. **Check CloudWatch logs** for any connection errors

## Step 4: Clean Git History (After Testing)

```bash
# Remove .env from current commit
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "🔒 Remove exposed credentials, add .env to gitignore"

# Remove from Git history (DESTRUCTIVE - backup first!)
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

## Step 5: Verify Security

- ✅ Credentials stored in AWS Secrets Manager
- ✅ New MongoDB password generated
- ✅ .env file removed from Git
- ✅ Application tested and working
- ✅ Git history cleaned

## Current Status

- [x] Backend role policy updated with Secrets Manager permissions
- [x] Secret created in AWS Secrets Manager
- [x] Application tested (demo quiz works with Secrets Manager!)
- [ ] MongoDB password rotated
- [ ] Application re-tested with new password
- [ ] Git history cleaned