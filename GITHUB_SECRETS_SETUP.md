# GitHub Secrets Setup Guide

This guide explains how to set up GitHub Secrets for automatic deployment to AWS EC2.

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. EC2_HOST
- **Description**: The public IP address or domain name of your EC2 instance
- **Example**: `54.123.45.67` or `your-domain.com`
- **How to get**: 
  - Go to AWS EC2 Console
  - Find your instance
  - Copy the "Public IPv4 address" or use your Elastic IP

### 2. EC2_USERNAME
- **Description**: The SSH username for your EC2 instance
- **Value**: `tournament` (the user we created during setup)
- **Note**: For default Ubuntu instances, it's usually `ubuntu`, but we use `tournament` for our app

### 3. EC2_SSH_KEY
- **Description**: The private SSH key to connect to your EC2 instance
- **How to get**:
  ```bash
  # On your EC2 instance, switch to tournament user
  sudo su - tournament
  
  # Display the private key
  cat ~/.ssh/id_ed25519
  ```
- **Important**: Copy the ENTIRE key including:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  [key content]
  -----END OPENSSH PRIVATE KEY-----
  ```

### 4. EC2_PORT
- **Description**: SSH port number
- **Value**: `22` (default SSH port)
- **Note**: Only change if you've configured a custom SSH port

## How to Add Secrets to GitHub

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add Each Secret

For each secret listed above:

1. Click **New repository secret**
2. Enter the **Name** (e.g., `EC2_HOST`)
3. Enter the **Value**
4. Click **Add secret**

### Example: Adding EC2_SSH_KEY

1. Click **New repository secret**
2. **Name**: `EC2_SSH_KEY`
3. **Value**: Paste the entire private key:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   [... rest of the key ...]
   -----END OPENSSH PRIVATE KEY-----
   ```
4. Click **Add secret**

## Verify Setup

After adding all secrets, you should see them listed in the Secrets page:

- ✅ EC2_HOST
- ✅ EC2_USERNAME
- ✅ EC2_SSH_KEY
- ✅ EC2_PORT

## Testing the Deployment

### Manual Test

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click on **Deploy to AWS EC2** workflow
4. Click **Run workflow** button
5. Select `main` branch
6. Click **Run workflow**

Watch the deployment progress in real-time!

### Automatic Deployment

Once configured, every push to the `main` branch will trigger an automatic deployment:

```bash
# On your local machine
git add .
git commit -m "Your commit message"
git push origin main

# GitHub Actions will automatically deploy to your EC2 instance!
```

## Troubleshooting

### Deployment Fails with "Permission denied (publickey)"

**Problem**: GitHub Actions can't connect to your EC2 instance.

**Solution**:
1. Verify the SSH key is correctly copied (including BEGIN and END lines)
2. Check that the public key is in `/home/tournament/.ssh/authorized_keys` on EC2
3. Ensure file permissions are correct:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

### Deployment Fails with "Host key verification failed"

**Problem**: GitHub Actions doesn't trust your EC2 host.

**Solution**: Add this step to your workflow before the SSH action:
```yaml
- name: Add SSH known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.EC2_HOST }} >> ~/.ssh/known_hosts
```

### Script Not Found Error

**Problem**: The `deploy.sh` script doesn't exist or isn't executable.

**Solution**: On your EC2 instance:
```bash
cd /var/www/tournamentArena
chmod +x deploy.sh
```

## Security Best Practices

1. **Never commit secrets to your repository**
   - Always use GitHub Secrets for sensitive data
   - Add `.env` files to `.gitignore`

2. **Rotate SSH keys regularly**
   - Generate new keys every 90 days
   - Update GitHub secrets accordingly

3. **Limit SSH access**
   - Use Security Groups to restrict SSH to specific IPs
   - Consider using a bastion host for production

4. **Monitor deployment logs**
   - Check GitHub Actions logs after each deployment
   - Set up alerts for failed deployments

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS EC2 Security Best Practices](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security.html)

---

**Need Help?**
If you encounter issues, check:
1. GitHub Actions logs (Actions tab in your repository)
2. Server logs: `sudo tail -f /var/log/tournament_deployment.log`
3. Backend logs: `sudo tail -f /var/log/tournament_backend.log`
