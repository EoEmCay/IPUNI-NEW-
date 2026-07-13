import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from './Modal';
import useAuthStore from '../../store/authStore';

export default function OnboardingTour() {
  const [showChoice, setShowChoice] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (user === null) return;

    const isDemoUser = user.is_demo || (user.email && user.email.startsWith('demo_'));
    const forceTour = localStorage.getItem('diaplus_force_tour');
    const hasSeenTour = localStorage.getItem('diaplus_has_seen_tour');
    
    if (forceTour || (isDemoUser && !hasSeenTour)) {
      const timer = setTimeout(() => {
        setRunTour(true);
        setStepIndex(0);
        localStorage.removeItem('diaplus_force_tour');
        localStorage.setItem('diaplus_has_seen_tour', 'true');
      }, 500);
      
      return () => clearTimeout(timer);
    }

    if (!isDemoUser && !hasSeenTour) {
      const timer = setTimeout(() => {
        setShowChoice(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleChoice = (wantTour) => {
    setShowChoice(false);
    localStorage.setItem('diaplus_has_seen_tour', 'true');
    if (wantTour) {
      setRunTour(true);
      setStepIndex(0);
    }
  };

  const steps = [
    {
      route: '/dashboard',
      target: '.tour-step-1',
      placement: 'bottom',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Ở đây có ba tính năng hỗ trợ:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li><strong>Biểu tượng sách:</strong> Xem lời khuyên sức khỏe từ chuyên gia</li>
            <li><strong>Biểu tượng loa chuông:</strong> Nhận thông báo nhắc nhở uống thuốc hoặc tiêm insulin đúng giờ</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/dashboard',
      target: '.tour-step-2',
      placement: 'top',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Đây là vùng theo dõi chỉ số sức khỏe. Nơi này hiển thị những lần đo gần nhất mà bạn đã lưu lại:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li><strong>Glucose (Đói):</strong> Đo lúc sáng trước khi ăn</li>
            <li><strong>Glucose (Sau ăn 2h):</strong> Đo 2 giờ sau khi ăn</li>
            <li><strong>Huyết áp:</strong> Chỉ số huyết áp hiện tại</li>
          </ul>
          <p style={{ marginTop: '8px', fontStyle: 'italic' }}>Nhấn 'Xem tất cả &gt;' để xem lịch sử đầy đủ.</p>
        </div>
      ),
    },
    {
      route: '/dashboard',
      target: '.tour-step-3',
      placement: 'top',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Phần 'Thuốc hôm nay' giúp bạn:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Xem danh sách thuốc cần uống trong ngày với giờ uống cụ thể</li>
            <li>Đánh dấu <strong>'Đã uống'</strong> hoặc <strong>'Chưa uống'</strong> để theo dõi liệu bạn có uống đúng giờ hay không</li>
            <li>Xem hướng dẫn từ bác sĩ (Uống sau bữa ăn chính, Dùng với nước ấm, v.v.)</li>
            <li>Bác sĩ kê đơn sẽ hiển thị ở đây</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/metrics',
      target: '.tour-step-4',
      placement: 'bottom',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tính năng 'Chỉ số' cho phép bạn:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li><strong>Nhập chỉ số:</strong> Ghi lại các giá trị glucose, đái tháo đường mỗi khi bạn đo</li>
            <li><strong>Theo dõi biểu đồ:</strong> Xem xu hướng chỉ số qua thời gian (vùng tiền đái, vùng đái tháo đường)</li>
            <li><strong>Chuyển tab:</strong> Chọn loại chỉ số muốn xem (Glucose đói, Glucose sau ăn, Dung nạp Glucose)</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/scan',
      target: '.tour-step-5',
      placement: 'bottom',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tính năng 'Chụp ảnh AI' giúp bạn:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Chụp hoặc tải ảnh liên quan đến đái tháo đường (kết quả xét nghiệm, thực phẩm, v.v.)</li>
            <li>AI sẽ phân tích ảnh của bạn tự động</li>
            <li><strong>Lưu ý:</strong> Ứng dụng chỉ nhận diện ảnh liên quan đến đái tháo đường - không xử lý các loại bệnh khác</li>
            <li><strong>Nút 'Lịch sử':</strong> Xem lại tất cả hình ảnh đã chụp trước đó</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/medications',
      target: '.tour-step-6',
      placement: 'top',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tab 'Thuốc' hiển thị toàn bộ danh sách thuốc bạn đang sử dụng:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Tên thuốc, liều lượng, tần suất uống</li>
            <li>Hướng dẫn sử dụng từ bác sĩ</li>
            <li>Trạng thái uống (đã uống/chưa uống)</li>
            <li>Bác sĩ kê đơn tên gì</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/appointments',
      target: '.tour-step-7',
      placement: 'top',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Tab 'Bác sĩ' giúp bạn:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li><strong>Xem lịch tái khám:</strong> Ngày giờ tái khám tiếp theo</li>
            <li><strong>Tên bác sĩ:</strong> Ai sẽ khám bạn (lấy từ đơn thuốc)</li>
            <li><strong>Chuẩn bị tài liệu:</strong> Không lộ thông tin cá nhân, để sẵn sàng cho lần tái khám</li>
          </ul>
        </div>
      ),
    },
    {
      route: '/settings',
      target: '.tour-step-8',
      placement: 'top',
      content: (
        <div style={{ textAlign: 'left', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Trong Cài đặt giọng nói, bạn có thể:</p>
          
          <p style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>a) Ghi âm giọng nói:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Bạn (hoặc người thân) có thể nhấn nút microphone để thu âm giọng nói của mình</li>
            <li>Sau khi ghi xong, nút play sẽ xuất hiện để bạn kiểm tra</li>
            <li><strong>Lưu ý:</strong> Hiện tại những âm thanh đã ghi được nhưng chưa thể phát lại, tính năng phát âm sẽ được cập nhật trong phiên bản tiếp theo</li>
          </ul>

          <p style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>b) Phát lại nhắc nhở:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Khi đến giờ uống thuốc, bạn có thể nhấn nút play để nghe nhắc nhở</li>
            <li>Nút dừng sẽ xuất hiện để bạn có thể dừng phát lại bất cứ lúc nào</li>
          </ul>

          <p style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>c) Cá nhân hóa nhắc nhở:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Thay vì giọng máy, con cái/vợ chồng/ông bà sẽ nghe giọng nói thực của người thân mình nhắc nhở uống thuốc</li>
            <li><strong>Lưu ý về giọng nói:</strong> App hiện đang sử dụng giọng nói Tiếng Anh đọc văn bản Tiếng Việt. Để có trải nghiệm tốt nhất, hãy chọn giọng nói Việt trong cài đặt hệ thống điện thoại của bạn hoặc chờ cập nhật sắp tới khi app hỗ trợ giọng nói Việt đọc Tiếng Việt tự nhiên hơn</li>
          </ul>

          <p style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>d) Cảnh báo sức khỏe khẩn cấp:</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li>Cài đặt cảnh báo tăng/giảm huyết áp</li>
            <li>Cài đặt cảnh báo tụt huyết áp khẩn cấp để bạn phản ứng kịp thời</li>
          </ul>
        </div>
      ),
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === 'close') {
      setRunTour(false);
      setStepIndex(0);
      return;
    }

    if (type === 'step:after' || type === 'error:target_not_found') {
      const nextStepIndex = index + (action === 'prev' ? -1 : 1);
      const nextStep = steps[nextStepIndex];
      
      if (!nextStep) {
        setRunTour(false);
        setStepIndex(0);
        return;
      }

      const prepareAndRunStep = () => {
        const checkAndRun = () => {
          const targetEl = document.querySelector(nextStep.target);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              setStepIndex(nextStepIndex);
              setRunTour(true);
            }, 400);
          } else {
            setStepIndex(nextStepIndex);
            setRunTour(true);
          }
        };

        if (document.querySelector(nextStep.target)) {
          checkAndRun();
        } else {
          const observer = new MutationObserver((mutations, obs) => {
            if (document.querySelector(nextStep.target)) {
              obs.disconnect();
              checkAndRun();
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => observer.disconnect(), 3000);
        }
      };

      setRunTour(false);
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
        setTimeout(prepareAndRunStep, 100);
      } else {
        prepareAndRunStep();
      }
    }
  };

  return (
    <>
      {showChoice && (
        <Modal title="Chào mừng đến với DIA+" onClose={() => handleChoice(false)}>
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <p style={{ marginBottom: 20, color: '#444' }}>
              Bạn muốn bắt đầu sử dụng ngay hay xem qua hướng dẫn các tính năng?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button 
                onClick={() => handleChoice(false)}
                style={{ padding: '10px 20px', borderRadius: 20, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
              >
                Tự trải nghiệm
              </button>
              <button 
                onClick={() => handleChoice(true)}
                style={{ padding: '10px 20px', borderRadius: 20, border: 'none', background: '#1B5FA6', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Hướng dẫn dùng app
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Joyride
        steps={steps}
        stepIndex={stepIndex}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        disableOverlayClose
        disableScrolling={true}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#1B5FA6',
            zIndex: 10000,
            width: 400,
          },
          tooltipContainer: {
            textAlign: 'left'
          }
        }}
        locale={{
          back: 'Quay lại',
          close: 'Đóng',
          last: 'Hoàn tất',
          next: 'Tiếp theo',
          skip: 'Bỏ qua',
        }}
      />
    </>
  );
}
