#!/bin/bash

# Setup CloudWatch Dashboard and Alarms for ERT Quiz App
# Run this after deploying your Amplify backend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up CloudWatch Monitoring for ERT Quiz App${NC}"

# Get Lambda function name
echo -e "\n${YELLOW}Finding Lambda function...${NC}"
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'mongo-connector')].FunctionName" --output text | head -1)

if [ -z "$FUNCTION_NAME" ]; then
    echo -e "${RED}Error: Could not find mongo-connector Lambda function${NC}"
    echo "Make sure you've deployed your Amplify backend first with: npx ampx sandbox"
    exit 1
fi

echo -e "${GREEN}Found Lambda function: ${FUNCTION_NAME}${NC}"

# Get AWS region
REGION=$(aws configure get region)
if [ -z "$REGION" ]; then
    REGION="us-east-1"
fi
echo -e "${GREEN}Using region: ${REGION}${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create CloudWatch Dashboard
echo -e "\n${YELLOW}Creating CloudWatch Dashboard...${NC}"

DASHBOARD_BODY=$(cat <<EOF
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Invocations", { "stat": "Sum", "label": "Total Invocations" } ],
                    [ ".", "Errors", { "stat": "Sum", "label": "Errors", "color": "#d62728" } ],
                    [ ".", "Throttles", { "stat": "Sum", "label": "Throttles", "color": "#ff7f0e" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${REGION}",
                "title": "Lambda Invocations & Errors",
                "period": 300,
                "dimensions": {
                    "FunctionName": "${FUNCTION_NAME}"
                }
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "Duration", { "stat": "Average", "label": "Average" } ],
                    [ "...", { "stat": "p50", "label": "p50" } ],
                    [ "...", { "stat": "p95", "label": "p95", "color": "#ff7f0e" } ],
                    [ "...", { "stat": "p99", "label": "p99", "color": "#d62728" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${REGION}",
                "title": "Lambda Duration (ms)",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0
                    }
                },
                "dimensions": {
                    "FunctionName": "${FUNCTION_NAME}"
                }
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ "AWS/Lambda", "ConcurrentExecutions", { "stat": "Maximum", "label": "Concurrent Executions" } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${REGION}",
                "title": "Lambda Concurrency",
                "period": 300,
                "dimensions": {
                    "FunctionName": "${FUNCTION_NAME}"
                }
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    [ { "expression": "100 * (m1 / m2)", "label": "Error Rate %", "id": "e1", "color": "#d62728" } ],
                    [ "AWS/Lambda", "Errors", { "id": "m1", "visible": false } ],
                    [ ".", "Invocations", { "id": "m2", "visible": false } ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "${REGION}",
                "title": "Lambda Error Rate (%)",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                },
                "dimensions": {
                    "FunctionName": "${FUNCTION_NAME}"
                }
            }
        },
        {
            "type": "log",
            "properties": {
                "query": "SOURCE '/aws/lambda/${FUNCTION_NAME}'\n| fields @timestamp, level, message, context\n| filter level = 'ERROR'\n| sort @timestamp desc\n| limit 20",
                "region": "${REGION}",
                "title": "Recent Errors",
                "stacked": false
            }
        }
    ]
}
EOF
)

aws cloudwatch put-dashboard \
    --dashboard-name "ERT-Quiz-App" \
    --dashboard-body "$DASHBOARD_BODY"

echo -e "${GREEN}✓ Dashboard created: ERT-Quiz-App${NC}"

# Create SNS Topic for Alarms (optional)
echo -e "\n${YELLOW}Creating SNS topic for alarms...${NC}"
SNS_TOPIC_ARN=$(aws sns create-topic --name ERT-Quiz-Alarms --query 'TopicArn' --output text 2>/dev/null || echo "")

if [ -n "$SNS_TOPIC_ARN" ]; then
    echo -e "${GREEN}✓ SNS Topic created: ${SNS_TOPIC_ARN}${NC}"
    echo -e "${YELLOW}To receive alarm notifications, subscribe your email:${NC}"
    echo -e "aws sns subscribe --topic-arn ${SNS_TOPIC_ARN} --protocol email --notification-endpoint YOUR_EMAIL@example.com"
else
    echo -e "${YELLOW}SNS topic already exists or could not be created${NC}"
    SNS_TOPIC_ARN="arn:aws:sns:${REGION}:${ACCOUNT_ID}:ERT-Quiz-Alarms"
fi

# Create CloudWatch Alarms
echo -e "\n${YELLOW}Creating CloudWatch Alarms...${NC}"

# Alarm 1: High Error Rate
aws cloudwatch put-metric-alarm \
    --alarm-name "ERT-Lambda-HighErrorRate" \
    --alarm-description "Alert when Lambda error rate exceeds 5%" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value=${FUNCTION_NAME} \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN} 2>/dev/null || echo "Alarm already exists"

echo -e "${GREEN}✓ Alarm created: ERT-Lambda-HighErrorRate${NC}"

# Alarm 2: High Duration
aws cloudwatch put-metric-alarm \
    --alarm-name "ERT-Lambda-HighDuration" \
    --alarm-description "Alert when Lambda duration exceeds 25 seconds" \
    --metric-name Duration \
    --namespace AWS/Lambda \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 25000 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value=${FUNCTION_NAME} \
    --treat-missing-data notBreaching \
    --alarm-actions ${SNS_TOPIC_ARN} 2>/dev/null || echo "Alarm already exists"

echo -e "${GREEN}✓ Alarm created: ERT-Lambda-HighDuration${NC}"

# Alarm 3: No Invocations (potential issue)
aws cloudwatch put-metric-alarm \
    --alarm-name "ERT-Lambda-NoInvocations" \
    --alarm-description "Alert when Lambda has no invocations for 1 hour" \
    --metric-name Invocations \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 3600 \
    --evaluation-periods 1 \
    --threshold 1 \
    --comparison-operator LessThanThreshold \
    --dimensions Name=FunctionName,Value=${FUNCTION_NAME} \
    --treat-missing-data breaching \
    --alarm-actions ${SNS_TOPIC_ARN} 2>/dev/null || echo "Alarm already exists"

echo -e "${GREEN}✓ Alarm created: ERT-Lambda-NoInvocations${NC}"

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}CloudWatch Monitoring Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDashboard: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=ERT-Quiz-App"
echo -e "\nAlarms created:"
echo -e "  • ERT-Lambda-HighErrorRate (>5% errors)"
echo -e "  • ERT-Lambda-HighDuration (>25s duration)"
echo -e "  • ERT-Lambda-NoInvocations (no activity for 1 hour)"
echo -e "\nTo receive email notifications, run:"
echo -e "${YELLOW}aws sns subscribe --topic-arn ${SNS_TOPIC_ARN} --protocol email --notification-endpoint YOUR_EMAIL@example.com${NC}"
echo -e "\nView logs:"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups/log-group/\$252Faws\$252Flambda\$252F${FUNCTION_NAME}"
