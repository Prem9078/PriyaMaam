import React, { useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { verifyPayment } from '../../services/api';
import { showAlert } from '../../components/AppAlert';

/**
 * RazorpayPaymentScreen
 *
 * Receives params:
 *   - order: { orderId, amount, currency, key, courseName }
 *   - courseId: string (UUID)
 *   - userEmail: string
 *   - userName: string
 *
 * On success → verifies payment with backend → navigates back with enrolled=true.
 * On failure / cancel → goes back.
 */
export default function RazorpayPaymentScreen({ route, navigation }) {
  const { order, courseId, userEmail, userName } = route.params;
  const webViewRef = useRef(null);

  const razorpayHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body style="margin:0;background:#fff;">
<script>
  var options = {
    key:         "${order.key}",
    amount:      "${order.amount}",
    currency:    "${order.currency}",
    name:        "Soham Sir Classes",
    description: "${order.courseName}",
    order_id:    "${order.orderId}",
    prefill: {
      email: "${userEmail}",
      name:  "${userName}"
    },
    theme: { color: "#6C63FF" },
    handler: function(response) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type:      "SUCCESS",
        paymentId: response.razorpay_payment_id,
        orderId:   response.razorpay_order_id,
        signature: response.razorpay_signature
      }));
    },
    modal: {
      ondismiss: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "CANCELLED" }));
      }
    }
  };
  var rzp = new Razorpay(options);
  rzp.on("payment.failed", function(resp) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type:  "FAILED",
      error: resp.error.description
    }));
  });
  rzp.open();
</script>
</body>
</html>`;

  const handleMessage = async (event) => {
    let data;
    try { data = JSON.parse(event.nativeEvent.data); }
    catch { return; }

    if (data.type === 'SUCCESS') {
      try {
        await verifyPayment({
          courseId,
          razorpayOrderId: data.orderId,
          razorpayPaymentId: data.paymentId,
          razorpaySignature: data.signature,
        });
        // Go back first, then show alert (avoids the missing course object crash)
        navigation.goBack();
        setTimeout(() => {
          showAlert('🎉 Payment Successful!', `You are now enrolled in "${order.courseName}"`);
        }, 300);
      } catch (err) {
        const msg = err.response?.data?.message || 'Payment verification failed.';
        showAlert('Error', msg);
        navigation.goBack();
      }
    } else if (data.type === 'CANCELLED') {
      navigation.goBack();
    } else if (data.type === 'FAILED') {
      showAlert('Payment Failed', data.error || 'Payment could not be processed.');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>✕  Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Checkout</Text>
      </View>

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: razorpayHtml }}
        onMessage={handleMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#6C63FF" />
            <Text style={styles.loadingText}>Loading payment gateway…</Text>
          </View>
        )}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#6C63FF', paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  cancelBtn: { marginRight: 16 },
  cancelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#6C63FF', fontSize: 14, fontWeight: '600' },
});
