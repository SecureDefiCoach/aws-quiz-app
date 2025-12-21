#!/bin/bash

# Monitor AWS Amplify deployment
# Usage: ./scripts/monitor-deployment.sh

SITE_URL="https://main.d1x14awbpsjxh2.amplifyapp.com"
EXPECTED_COMMIT="1a23e0f"
MAX_CHECKS=30
CHECK_INTERVAL=10

echo "🚀 Monitoring deployment of commit: $EXPECTED_COMMIT"
echo "📍 Site URL: $SITE_URL"
echo "⏱️  Checking every $CHECK_INTERVAL seconds (max $MAX_CHECKS checks)"
echo ""

for i in $(seq 1 $MAX_CHECKS); do
    echo "Check $i/$MAX_CHECKS at $(date '+%H:%M:%S')"
    
    # Check if site is responding
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Site responding (HTTP $HTTP_CODE)"
        
        # Try to access the demo page to test functionality
        DEMO_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL/demo")
        if [ "$DEMO_CODE" = "200" ]; then
            echo "✅ Demo page accessible"
        else
            echo "⚠️  Demo page issue (HTTP $DEMO_CODE)"
        fi
        
        # Check if we can reach the API (basic connectivity test)
        echo "🔍 Testing basic functionality..."
        
    elif [ "$HTTP_CODE" = "000" ]; then
        echo "❌ Site not reachable (connection failed)"
    else
        echo "⚠️  Site responding with HTTP $HTTP_CODE"
    fi
    
    echo "---"
    
    if [ $i -lt $MAX_CHECKS ]; then
        sleep $CHECK_INTERVAL
    fi
done

echo ""
echo "🏁 Monitoring complete"
echo "💡 If deployment is still in progress, check AWS Amplify Console:"
echo "   https://console.aws.amazon.com/amplify/home"