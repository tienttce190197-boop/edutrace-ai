/* ==========================================================================
   EDUTRACE AI - INTERACTIVE SCRIPTS & VALUE-FIRST AI ASSISTANT
   Dự án Khởi nghiệp EXE101 - FPT University Cần Thơ (Nhóm 6)
   Theo nội dung Bản Đề Xuất Dự Án Khởi Nghiệp (Proposal.docx)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAIAssistant();
  initB2BTabs();
  initPricingToggle();
  initExerciseModal();
  initCenterBookingModal();
  initConsultationForm();
});

/* ==========================================================================
   1. NAVBAR & NAVIGATION
   ========================================================================== */
function initNavbar() {
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
    });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (menu) menu.classList.remove('open');
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        current = sectionId;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   2. AI ASSISTANT & EXERCISE HUB ENGINE (VALUE-FIRST PROPOSAL MECHANISM)
   Phụ huynh chia sẻ tự do -> AI bóc tách từ khóa -> Gợi ý bài tập 3-5 phút
   -> Phễu chuyển đổi sang can thiệp trực tiếp 1-1 tại trung tâm
   ========================================================================== */

const aiScenariosData = {
  scenario1: {
    name: 'Bé Bo (2.5 tuổi) • Chậm nói & Ít giao tiếp mắt',
    input: 'Bé nhà mình hiện được 2 tuổi rưỡi (30 tháng), chưa biết nói từ đơn nào ngoài tiếng ê a vô nghĩa. Khi mẹ gọi tên thì bé rất hiếm khi quay đầu lại, không nhìn vào mắt người đối diện. Khi muốn lấy đồ chơi trên cao, bé chỉ nắm tay kéo người lớn lại gần chứ không chỉ tay hay phát âm.',
    ageGroup: '1.5 – 3 tuổi (Can thiệp sớm thời điểm vàng)',
    extractedKeywords: [
      { text: 'Độ tuổi: 2.5 tuổi', type: 'age' },
      { text: 'Chậm phát triển ngôn ngữ biểu đạt', type: 'default' },
      { text: 'Thiếu phản xạ gọi tên (Name calling)', type: 'default' },
      { text: 'Giảm tương tác mắt (Eye-contact <20%)', type: 'default' },
      { text: 'Chỉ dấu sàng lọc: M-CHAT-R/F mục 2, 5, 12', type: 'mchat' }
    ],
    advice: 'Chào bạn! Ở mốc 2.5 tuổi, việc bé chưa bật âm đơn và ít giao tiếp mắt là những dấu hiệu chỉ báo cần sự hỗ trợ kịp thời. Bạn đừng quá lo lắng hoặc tự trách mình. EduTrace AI đã đối soát hồ sơ và gợi ý 3 bài tập thực hành 3 – 5 phút từ các trung tâm uy tín tại Quận Ninh Kiều để bạn bắt đầu tập ngay cùng con tại nhà hôm nay.',
    exercises: [
      {
        id: 'ex-speech-01',
        title: 'Kỹ thuật Thổi bong bóng xà phòng & Kích thích Bật âm đơn /a/, /ba/',
        centerName: 'Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều',
        centerAddress: 'Đường Nguyễn Văn Cừ nối dài, P. An Bình, Q. Ninh Kiều, Cần Thơ',
        instructor: 'ThS. Nguyễn Mai Anh (Giáo viên Giáo dục Đặc biệt)',
        duration: '3 phút 45 giây',
        category: 'Bật âm đơn & Tương tác mắt',
        image: 'images/image1.jpg',
        description: 'Bài tập tương tác vui nhộn sử dụng hiệu ứng bong bóng bay lơ lửng để kích thích trẻ hướng mắt nhìn lên môi người lớn và bật ra âm thanh tự nhiên.',
        materials: 'Lọ thổi bong bóng xà phòng an toàn cho trẻ em, thảm ngồi êm ái.',
        steps: [
          'Bước 1: Ngồi đối diện với con ở cự ly 60–80cm, mắt ngang tầm mắt của bé.',
          'Bước 2: Thổi một chùm bong bóng lớn rồi dừng lại, giữ ống thổi gần miệng của bạn.',
          'Bước 3: Nhìn thẳng vào mắt con, tạo khẩu hình to rõ âm "A... BÓNG!", sau đó ngưng lại chờ con có phản ứng phát âm hoặc chu môi.',
          'Bước 4: Ngay khi con phát ra bất kỳ âm thanh nào hoặc nhìn vào mắt bạn, lập tức thổi tiếp bong bóng để tưởng thưởng tích cực.'
        ],
        safetyNotes: 'Không ép trẻ khi trẻ đang quấy khóc. Mỗi ngày thực hiện 2–3 hiệp, mỗi hiệp chỉ 3–5 phút.'
      },
      {
        id: 'ex-speech-02',
        title: 'Trò chơi Ú òa & Tương tác ánh mắt qua gương cảm xúc',
        centerName: 'Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ',
        centerAddress: 'Đường Nguyễn Tri Phương, P. An Khánh, Q. Ninh Kiều, Cần Thơ',
        instructor: 'ThS. Đỗ Hoàng Nam (Chuyên gia Can thiệp sớm)',
        duration: '4 phút 10 giây',
        category: 'Tương tác xã hội & Phản xạ gọi tên',
        image: 'images/image3.jpg',
        description: 'Tận dụng gương soi gia đình giúp trẻ dễ dàng nhận biết phản xạ ánh mắt và thích thú với biểu cảm khuôn mặt của cha mẹ.',
        materials: 'Gương lớn có sẵn trong gia đình, một chiếc khăn voan mềm mỏng thoáng khí.',
        steps: [
          'Bước 1: Mẹ bế bé ngồi phía trước gương lớn, cùng nhìn vào hình ảnh của hai mẹ con.',
          'Bước 2: Mẹ lấy khăn mỏng che mặt mình lại, gọi nhẹ nhàng: "[Tên con] ơi, mẹ đâu rồi?".',
          'Bước 3: Mở khăn thật nhanh và mỉm cười rạng rỡ nói "Ú òa!", quan sát xem bé có cười và nhìn vào mắt mẹ qua gương không.',
          'Bước 4: Đưa khăn cho bé cầm thử và tiếp tục tương tác lặp lại 3–5 lần.'
        ],
        safetyNotes: 'Dùng khăn voan mỏng thoáng khí để tránh cảm giác ngột ngạt cho trẻ.'
      },
      {
        id: 'ex-speech-03',
        title: 'Thẻ tranh Flashcard tương tác nhu cầu & Kỹ thuật Bắt chước khẩu hình',
        centerName: 'Trường Dạy Trẻ Khuyết Tật Tương Lai Cần Thơ',
        centerAddress: 'Đường 30/4, P. Xuân Khánh, Q. Ninh Kiều, Cần Thơ',
        instructor: 'Cô Lê Thị Kim Phượng (Cử nhân Giáo dục Đặc biệt)',
        duration: '3 phút 30 giây',
        category: 'Giao tiếp nhu cầu & Chỉ tay',
        image: 'images/image1.jpg',
        description: 'Dạy trẻ thói quen chỉ tay vào hình ảnh đồ vật mong muốn thay vì kéo tay người lớn, bước đầu kích thích phát âm từ đơn.',
        materials: 'Bộ 4-6 thẻ tranh các món bé thích nhất (sữa, xe ô tô, quả bóng).',
        steps: [
          'Bước 1: Đặt 2 thẻ tranh trước mặt con (ví dụ: hộp sữa và quả bóng).',
          'Bước 2: Hỏi chậm rãi: "Con muốn uống sữa hay chơi bóng?".',
          'Bước 3: Cầm tay bé nhẹ nhàng hướng ngón trỏ chỉ vào món bé muốn, đồng thời phát âm to rõ từ đó 2 lần.',
          'Bước 4: Đưa ngay món đồ cho bé khi bé chạm vào thẻ tranh tương ứng để hình thành phản xạ có điều kiện.'
        ],
        safetyNotes: 'Chỉ dùng từ đơn ngắn gọn, nói chậm rãi và giữ nét mặt tươi vui khích lệ.'
      }
    ]
  },

  scenario2: {
    name: 'Bé Minh (4 tuổi) • Phổ Tự Kỷ (ASD) & Hành vi Stimming',
    input: 'Bé nhà mình 4 tuổi, đã có kết luận chẩn đoán Tự kỷ (ASD). Bé thường xuyên bị quá tải khi nghe tiếng ồn lạ, khi đó bé sẽ đung đưa cơ thể liên tục ra trước sau và vỗ tay bồn chồn (Stimming). Bé khó tập trung vào đồ chơi quá 2 phút và thường né tránh ánh nhìn khi người khác bắt chuyện.',
    ageGroup: '3 – 6 tuổi (Giai đoạn rèn luyện giác quan & hành vi)',
    extractedKeywords: [
      { text: 'Độ tuổi: 4 tuổi', type: 'age' },
      { text: 'Phổ Tự Kỷ (ASD) mức độ 1-2', type: 'default' },
      { text: 'Hành vi rập khuôn: Vỗ tay & Đung đưa người (Stimming)', type: 'default' },
      { text: 'Quá tải cảm giác thính giác (Sensory Overload)', type: 'default' },
      { text: 'Chỉ dấu sàng lọc: Phác đồ điều hòa giác quan M-CHAT-R/F', type: 'mchat' }
    ],
    advice: 'Chào bạn! Hành vi vỗ tay và đung đưa cơ thể là cách não bộ của bé tự xoa dịu khi bị quá tải giác quan. Thay vì cố gắng cấm đoán hay quát mắng con, phụ huynh có thể dùng các bài tập điều hòa cảm giác sâu (Deep Pressure) và lịch sinh hoạt trực quan dưới đây để giúp hệ thần kinh của bé lắng dịu an toàn.',
    exercises: [
      {
        id: 'ex-asd-01',
        title: 'Kỹ thuật "Chiếc kén bình yên" & Massage điều hòa xúc giác sâu',
        centerName: 'Phòng khám Chuyên khoa Tâm lý Nhi Đồng Ninh Kiều',
        centerAddress: 'Đường Trần Hưng Đạo, P. An Phú, Q. Ninh Kiều, Cần Thơ',
        instructor: 'BS. CKI Lê Thanh Thảo (Bác sĩ Tâm lý Nhi khoa)',
        duration: '4 phút 30 giây',
        category: 'Điều hòa cảm giác & Giảm Stimming',
        image: 'images/image2.jpg',
        description: 'Tạo áp lực sâu lên các thụ cảm thể cơ bắp giúp trẻ giải tỏa căng thẳng thần kinh, giảm thiểu tần suất bộc phát hành vi rập khuôn.',
        materials: 'Một tấm chăn bông mềm hoặc đệm hơi gia đình, không gian yên tĩnh.',
        steps: [
          'Bước 1: Cho bé nằm trên thảm, dùng chăn mềm cuộn tròn quanh người con với độ chặt vừa phải như một chiếc kén.',
          'Bước 2: Dùng hai bàn tay xoa bóp nhẹ nhàng từ vai xuống bắp tay và dọc cẳng chân của con.',
          'Bước 3: Nói chuyện với tông giọng trầm ấm, chậm rãi: "Mẹ đang ở đây, con rất an toàn".',
          'Bước 4: Duy trì trong 3–4 phút đến khi nhận thấy nhịp thở của con đều đặn và bàn tay thả lỏng.'
        ],
        safetyNotes: 'Không quấn chăn qua đầu trẻ, luôn để hở mặt và ngực để con hít thở thoải mái.'
      },
      {
        id: 'ex-asd-02',
        title: 'Lịch sinh hoạt bằng hình ảnh (PECS) & Trò chơi Bắt chước động tác',
        centerName: 'Trung tâm Giáo dục Chuyên biệt Từng Bước Nhỏ',
        centerAddress: 'Đường Nguyễn Tri Phương, P. An Khánh, Q. Ninh Kiều, Cần Thơ',
        instructor: 'ThS. Đỗ Hoàng Nam (Chuyên gia Can thiệp)',
        duration: '4 phút 00 giây',
        category: 'Lịch trình trực quan & Bắt chước hành vi',
        image: 'images/image1.jpg',
        description: 'Giúp trẻ ASD chủ động nắm bắt chuỗi hoạt động trong ngày, giảm lo âu do không đoán trước được sự kiện tiếp theo.',
        materials: 'Bảng bìa cứng gắn velcro và 4 thẻ hình: Rửa tay -> Ăn cơm -> Đánh răng -> Đi ngủ.',
        steps: [
          'Bước 1: Cùng bé đứng trước bảng lịch sinh hoạt trước giờ ăn tối.',
          'Bước 2: Chỉ tay vào hình "Rửa tay" và nói: "Đến giờ rửa tay, con gỡ hình dán vào ô xong nhé!".',
          'Bước 3: Mẹ làm mẫu động tác rửa tay và bảo con: "Làm giống mẹ nào!".',
          'Bước 4: Khen ngợi ngay khi con thực hiện xong động tác bắt chước.'
        ],
        safetyNotes: 'Hình ảnh cần rõ ràng, tối giản chi tiết thừa để trẻ không bị phân tâm thị giác.'
      },
      {
        id: 'ex-asd-03',
        title: 'Trò chơi Bóp đất nặn & Phân loại cúc áo rèn luyện vận động tinh',
        centerName: 'Trung tâm Can thiệp Sớm Ánh Sao Ninh Kiều',
        centerAddress: 'Đường Nguyễn Văn Cừ nối dài, Q. Ninh Kiều, Cần Thơ',
        instructor: 'Cô Trần Thu Trang (Cử nhân Giáo dục Đặc biệt)',
        duration: '3 phút 50 giây',
        category: 'Vận động tinh & Kéo dài chú ý',
        image: 'images/image3.jpg',
        description: 'Kết hợp xúc giác bàn tay và khả năng tập trung thị giác để chuyển hướng chú ý của trẻ khỏi các kích thích gây lo âu bên ngoài.',
        materials: 'Đất nặn bột mì tự nhiên không độc hại, 10-15 hạt cúc áo lớn nhiều màu.',
        steps: [
          'Bước 1: Đặt cục đất nặn lên bàn, mẹ dùng ngón tay ấn các hạt cúc áo chìm vào trong khối đất.',
          'Bước 2: Hướng dẫn bé dùng ngón cái và ngón trỏ khéo léo bới và nhặt từng chiếc cúc ra ngoài.',
          'Bước 3: Đếm to nhịp nhàng "Một cúc đỏ, hai cúc xanh..." để giữ nhịp chú ý của trẻ.',
          'Bước 4: Khen ngợi và cất cúc áo khi trò chơi kết thúc sau 3–5 phút.'
        ],
        safetyNotes: 'Chọn hạt cúc áo kích thước lớn (>3cm) để tuyệt đối tránh nguy cơ trẻ nuốt phải.'
      }
    ]
  },

  scenario3: {
    name: 'Bé An (5 tuổi) • Tăng động giảm chú ý (ADHD) & Khó ngồi yên',
    input: 'Bé An năm nay 5 tuổi chuẩn bị vào lớp 1. Cô giáo mầm non thường xuyên phàn nàn bé không thể ngồi yên quá 2 phút, hay chạy nhảy lung tung trong lớp, làm ồn và rất khó kiềm chế cảm xúc khi không được như ý. Ở nhà khi mẹ dạy vẽ tranh hay xếp hình thì bé chỉ làm qua loa rồi bỏ chạy.',
    ageGroup: '5 – 10 tuổi (Chuẩn bị vào lớp 1 & Tiểu học hòa nhập)',
    extractedKeywords: [
      { text: 'Độ tuổi: 5 tuổi', type: 'age' },
      { text: 'Tăng động giảm chú ý (ADHD)', type: 'default' },
      { text: 'Thời gian chú ý ngắn (Attention Span < 2 phút)', type: 'default' },
      { text: 'Kém kiểm soát ức chế hành vi (Inhibition control)', type: 'default' },
      { text: 'Khớp chỉ dấu thang đánh giá hành vi trẻ em', type: 'mchat' }
    ],
    advice: 'Chào bạn! Trẻ có biểu hiện ADHD không phải là trẻ hư hay cố tình chống đối, mà do vùng não điều khiển sự chú ý và kiềm chế bộc phát chưa hoàn thiện. Phương pháp tối ưu từ các chuyên gia là áp dụng trò chơi có luật ngắn 3 – 5 phút, chia nhỏ nhiệm vụ và bài tập thở xoa dịu thần kinh.',
    exercises: [
      {
        id: 'ex-adhd-01',
        title: 'Trò chơi "Đèn Xanh – Đèn Đỏ" rèn luyện khả năng ức chế xung động',
        centerName: 'Trung tâm Đào tạo Kỹ năng & Can thiệp Rồng Việt Cần Thơ',
        centerAddress: 'Đường Trần Văn Hoài, P. Xuân Khánh, Q. Ninh Kiều, Cần Thơ',
        instructor: 'ThS. Nguyễn Trọng Nhân (Chuyên gia Tâm lý học đường)',
        duration: '4 phút 15 giây',
        category: 'Kiểm soát bộc phát & Nghe hiệu lệnh',
        image: 'images/image2.jpg',
        description: 'Trò chơi kinh điển được chuẩn hóa trong giáo dục đặc biệt giúp não bộ của trẻ luyện tập phanh hãm (ức chế hành vi) khi gặp hiệu lệnh dừng lại.',
        materials: '2 tấm bìa tròn màu Xanh lá cây và Đỏ (hoặc hiệu lệnh khẩu lệnh).',
        steps: [
          'Bước 1: Giải thích luật chơi ngắn gọn: "Mẹ giơ Đèn Xanh con được nhảy bước nhỏ. Đèn Đỏ là phải đứng bất động như tượng đá!".',
          'Bước 2: Mẹ hô "Đèn Xanh" cho bé bước lên 3-4 nhịp, bất ngờ hô "Đèn Đỏ" và quan sát phản xạ dừng lại của con.',
          'Bước 3: Nếu con giữ nguyên tư thế được 3 giây, mẹ vỗ tay khen thưởng ngay bằng 1 sticker.',
          'Bước 4: Tăng dần độ khó bằng cách đổi lệnh nhanh hơn trong vòng 4 phút.'
        ],
        safetyNotes: 'Dọn dẹp sàn nhà thông thoáng, tránh chướng ngại vật trơn trượt.'
      },
      {
        id: 'ex-adhd-02',
        title: 'Kỹ thuật "Thở bóng bay xoa dịu" & Thổi nến điều hòa cảm xúc',
        centerName: 'Trung tâm Can thiệp sớm & Trị liệu VT Care Cần Thơ',
        centerAddress: 'Đường Mậu Thân, P. An Hòa, Q. Ninh Kiều, Cần Thơ',
        instructor: 'Chuyên viên Phan Hoài Bảo',
        duration: '3 phút 40 giây',
        category: 'Hạ nhiệt cảm xúc & Điều hòa nhịp thở',
        image: 'images/image1.jpg',
        description: 'Hướng dẫn trẻ hít thở sâu bằng cơ hoành thông qua hình tượng quả bóng bay trong bụng để tự làm dịu cơn bồn chồn.',
        materials: 'Một quả bóng bay mềm hoặc hình ảnh quả bóng trên giấy.',
        steps: [
          'Bước 1: Mẹ đặt tay lên bụng của bé, hướng dẫn con hít vào thật sâu bằng mũi để "bóng bay trong bụng phồng to".',
          'Bước 2: Giữ hơi thở lại trong 2 giây rồi từ từ thở ra bằng miệng để "bóng bay xẹp từ từ".',
          'Bước 3: Lặp lại động tác 5 nhịp, sau đó hỏi con cảm thấy cơ thể nhẹ nhõm hơn chưa.',
          'Bước 4: Khen ngợi khi con chủ động hít thở mỗi khi cảm thấy tức giận hoặc bồn chồn.'
        ],
        safetyNotes: 'Thực hiện với nhịp độ thư thái, không thở quá nhanh tránh gây chóng mặt.'
      },
      {
        id: 'ex-adhd-03',
        title: 'Chia nhỏ nhiệm vụ kèm Đồng hồ đếm ngược Pomodoro nhí',
        centerName: 'Trung tâm Hỗ trợ Tâm lý Chong Chóng Cần Thơ',
        centerAddress: 'Đường 3/2, P. Hưng Lợi, Q. Ninh Kiều, Cần Thơ',
        instructor: 'Chuyên viên Trịnh Kim Yến',
        duration: '5 phút',
        category: 'Kéo dài sự tập trung có chủ đích',
        image: 'images/image3.jpg',
        description: 'Thay vì bắt trẻ ngồi học 30 phút, chia thành các chặng 3–5 phút kèm đồng hồ cát thị giác để trẻ nhìn thấy mục tiêu rõ ràng.',
        materials: 'Đồng hồ cát 3 phút hoặc ứng dụng đồng hồ hẹn giờ thị giác có màu sắc.',
        steps: [
          'Bước 1: Thống nhất một nhiệm vụ cực nhỏ: "Tô màu xong một bông hoa này nhé".',
          'Bước 2: Lật ngược đồng hồ cát: "Khi cát chảy hết là con hoàn thành nhiệm vụ và được nghỉ 2 phút chơi bóng!".',
          'Bước 3: Ngồi cạnh động viên nhưng không can thiệp vào tay của con.',
          'Bước 4: Khi chuông reo, cho con đứng dậy vận động ngay lập tức như cam kết.'
        ],
        safetyNotes: 'Luôn giữ đúng lời hứa cho con giải lao khi hết giờ để duy trì lòng tin.'
      },
      {
        id: 'ex-adhd-04',
        title: 'Thử thách Chuyền bóng bằng thìa & Đi thăng bằng trên vạch kẻ',
        centerName: 'Trung tâm Can thiệp Nụ Cười Hồng Cần Thơ',
        centerAddress: 'Đường Tầm Vu, P. Hưng Lợi, Q. Ninh Kiều, Cần Thơ',
        instructor: 'Cô Lê Thị Kim Phượng (Cử nhân GDĐB)',
        duration: '3 phút 30 giây',
        category: 'Thăng bằng & Phối hợp vận động',
        image: 'images/image2.jpg',
        description: 'Buộc trẻ phải điều phối đồng thời mắt, tay và bước chân, kéo dài sự tập trung có chủ đích từ 2 phút lên 5 phút.',
        materials: '1 chiếc thìa nhựa lớn, 1 quả bóng bàn nhẹ, cuộn băng dính màu dán sàn.',
        steps: [
          'Bước 1: Dán một đường băng dính thẳng dài 3 mét trên nền nhà.',
          'Bước 2: Cho bé cầm thìa đặt quả bóng bàn lên trên, yêu cầu bước từng bước dọc theo vạch băng dính mà không làm bóng rơi.',
          'Bước 3: Bấm đồng hồ đếm thời gian để kích thích tinh thần chinh phục kỷ lục của con.',
          'Bước 4: Cho con thực hiện 3 vòng lượt đi và về, mỗi vòng nghỉ 20 giây.'
        ],
        safetyNotes: 'Động viên khích lệ khi con lỡ làm rơi bóng, không tạo áp lực phê bình.'
      }
    ]
  }
};

let currentSelectedScenario = 'scenario1';
let currentActiveExercise = null;

function initAIAssistant() {
  const chipButtons = document.querySelectorAll('.scenario-chip-btn');
  const textarea = document.getElementById('aiCustomInput');
  const analyzeBtn = document.getElementById('btnAIAnalyze');
  const voiceBtn = document.getElementById('btnAIVoice');

  // Load initial scenario
  renderScenario(aiScenariosData.scenario1);

  // Scenario quick chips
  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      chipButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const scenarioKey = btn.dataset.scenario;
      if (aiScenariosData[scenarioKey]) {
        currentSelectedScenario = scenarioKey;
        renderScenario(aiScenariosData[scenarioKey]);
      }
    });
  });

  // Custom text analyze
  if (analyzeBtn && textarea) {
    analyzeBtn.addEventListener('click', () => {
      const customText = textarea.value.trim();
      if (!customText) {
        showToast('Vui lòng nhập hoặc chọn chia sẻ tình trạng của con!');
        return;
      }

      // Simulate AI analysis process
      analyzeBtn.disabled = true;
      analyzeBtn.innerHTML = `
        <svg class="spin-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10"></path>
        </svg>
        AI Đang Bóc Tách Từ Khóa &amp; Đối Soát Bài Tập...
      `;

      setTimeout(() => {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Phân Tích Bằng Trợ Lý AI
        `;

        // Check if text matches keywords or generate dynamic response
        let matchedScenario = aiScenariosData.scenario1;
        const lower = customText.toLowerCase();

        if (lower.includes('stimming') || lower.includes('vỗ tay') || lower.includes('đung đưa') || lower.includes('tự kỷ')) {
          matchedScenario = aiScenariosData.scenario2;
        } else if (lower.includes('adhd') || lower.includes('tăng động') || lower.includes('ngồi yên') || lower.includes('chạy')) {
          matchedScenario = aiScenariosData.scenario3;
        }

        renderCustomAnalysis(customText, matchedScenario);
        showToast('Trợ lý AI đã phân tích xong và gợi ý các bài tập 3-5 phút phù hợp nhất!');
      }, 700);
    });
  }

  // Voice button simulation
  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      showToast('Đang lắng nghe giọng nói của bạn... Hãy nói tình trạng của con bạn (Ví dụ: Bé 3 tuổi chưa biết nói...).');
      setTimeout(() => {
        if (textarea) {
          textarea.value = 'Bé nhà mình 2 tuổi rưỡi, chưa biết gọi tên ba mẹ, hay kéo tay khi cần đồ...';
          analyzeBtn.click();
        }
      }, 2000);
    });
  }
}

function renderScenario(data) {
  const textarea = document.getElementById('aiCustomInput');
  if (textarea) textarea.value = data.input;

  renderKeywordsAndAdvice(data.extractedKeywords, data.advice, data.ageGroup);
  renderExerciseCards(data.exercises);
}

function renderCustomAnalysis(userInput, matchedScenario) {
  // Extract custom age if specified
  const ageMatch = userInput.match(/(\d+([\.,]\d+)?)\s*(tuổi|tháng)/i);
  let customAgeTag = ageMatch ? `Độ tuổi bóc tách: ${ageMatch[0]}` : matchedScenario.extractedKeywords[0].text;

  const dynamicKeywords = [
    { text: customAgeTag, type: 'age' },
    ...matchedScenario.extractedKeywords.slice(1)
  ];

  renderKeywordsAndAdvice(dynamicKeywords, matchedScenario.advice, matchedScenario.ageGroup);
  renderExerciseCards(matchedScenario.exercises);
}

function renderKeywordsAndAdvice(keywords, advice, ageGroup) {
  const container = document.getElementById('aiAnalysisKeywords');
  const adviceEl = document.getElementById('aiAdviceText');

  if (container) {
    container.innerHTML = keywords.map(kw => {
      let cls = 'keyword-tag';
      if (kw.type === 'age') cls += ' tag-age';
      if (kw.type === 'mchat') cls += ' tag-mchat';
      return `<span class="${cls}">${kw.text}</span>`;
    }).join('');
  }

  if (adviceEl) {
    adviceEl.textContent = advice;
  }
}

function renderExerciseCards(exercises) {
  const listContainer = document.getElementById('recommendedExerciseList');
  if (!listContainer) return;

  listContainer.innerHTML = exercises.map(ex => `
    <div class="exercise-recom-card">
      <div class="ex-thumb-wrap">
        <img src="${ex.image}" alt="${ex.title}">
        <span class="ex-duration-badge">⏱️ ${ex.duration}</span>
        <div class="ex-play-overlay">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
      </div>
      <div class="ex-info-wrap">
        <div class="ex-title-row">
          <h6>${ex.title}</h6>
          <div class="ex-center-meta">
            <span>Đơn vị: <strong>${ex.centerName}</strong></span>
            <span>•</span>
            <span>${ex.instructor}</span>
          </div>
        </div>
        <div class="ex-tags-row">
          <span class="ex-skill-tag">🎯 ${ex.category}</span>
          <span class="ex-skill-tag" style="background: rgba(16,185,129,0.15); color: #34d399;">✓ Đã kiểm duyệt 2 Lớp</span>
        </div>
        <div class="ex-actions-row">
          <button class="btn-ex-view" onclick="openExerciseDetail('${ex.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Xem Hướng Dẫn &amp; Tập Tại Nhà
          </button>
          <button class="btn-ex-convert" onclick="openCenterBooking('${ex.centerName}', '${ex.centerAddress}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Đăng Ký Học Trực Tiếp 1-1 Tại TT Này
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Find exercise by ID in all scenarios
function findExerciseById(id) {
  for (const sKey in aiScenariosData) {
    const found = aiScenariosData[sKey].exercises.find(e => e.id === id);
    if (found) return found;
  }
  return null;
}

/* ==========================================================================
   3. EXERCISE DETAIL MODAL & VIDEO SIMULATOR
   ========================================================================== */
function initExerciseModal() {
  const modal = document.getElementById('exerciseModal');
  const closeBtn = document.getElementById('closeExerciseModal');

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
}

window.openExerciseDetail = function(exerciseId) {
  const ex = findExerciseById(exerciseId);
  if (!ex) return;
  currentActiveExercise = ex;

  const modal = document.getElementById('exerciseModal');
  if (!modal) return;

  document.getElementById('modalExTitle').textContent = ex.title;
  document.getElementById('modalExDuration').textContent = ex.duration;
  document.getElementById('modalExCenter').textContent = ex.centerName;
  document.getElementById('modalExInstructor').textContent = ex.instructor;
  document.getElementById('modalExDesc').textContent = ex.description;
  document.getElementById('modalExMaterials').textContent = ex.materials;
  document.getElementById('modalExSafety').textContent = ex.safetyNotes;

  const timelineContainer = document.getElementById('modalExStepsTimeline');
  if (timelineContainer) {
    timelineContainer.innerHTML = ex.steps.map((st, idx) => `
      <div class="exercise-step-row">
        <div class="step-circle">${idx + 1}</div>
        <div class="step-content">
          <strong>${st.split(':')[0] || 'Bước ' + (idx + 1)}</strong>
          <p>${st.includes(':') ? st.split(':')[1] : st}</p>
        </div>
      </div>
    `).join('');
  }

  const convertBtn = document.getElementById('modalConvertBtn');
  if (convertBtn) {
    convertBtn.onclick = () => {
      modal.classList.remove('active');
      openCenterBooking(ex.centerName, ex.centerAddress);
    };
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

/* ==========================================================================
   4. CENTER 1-1 DIRECT INTERVENTION BOOKING MODAL (VALUE-FIRST FUNNEL)
   Phụ huynh thấy con hợp phương pháp -> Đăng ký can thiệp 1-1 tại trung tâm
   ========================================================================== */
function initCenterBookingModal() {
  const modal = document.getElementById('centerBookingModal');
  const closeBtn = document.getElementById('closeCenterBookingModal');
  const form = document.getElementById('centerBookingForm');

  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const parentName = form.querySelector('[name="parentName"]')?.value.trim();
      const centerName = form.querySelector('[name="targetCenter"]')?.value;

      showToast(`Chúc mừng ${parentName}! EduTrace AI đã kết nối lịch can thiệp 1-1 của bạn với ${centerName}. Chuyên viên trung tâm sẽ gọi điện xác nhận trong 24h.`);
      form.reset();
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }
}

window.openCenterBooking = function(centerName, centerAddress) {
  const modal = document.getElementById('centerBookingModal');
  if (!modal) return;

  const targetCenterInput = document.getElementById('bookingTargetCenter');
  const centerDisplay = document.getElementById('bookingCenterDisplay');
  const addressDisplay = document.getElementById('bookingAddressDisplay');

  if (targetCenterInput) targetCenterInput.value = centerName;
  if (centerDisplay) centerDisplay.textContent = centerName;
  if (addressDisplay) addressDisplay.textContent = centerAddress || 'Quận Ninh Kiều, TP. Cần Thơ';

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

/* ==========================================================================
   5. B2B / B2C ARCHITECTURE TABS
   ========================================================================== */
function initB2BTabs() {
  const tabs = document.querySelectorAll('.b2b-tab-btn');
  const panels = document.querySelectorAll('.b2b-content-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const activePanel = document.getElementById(target);
      if (activePanel) activePanel.classList.add('active');
    });
  });
}

/* ==========================================================================
   6. PRICING TOGGLE (MONTHLY VS YEARLY - 199.000đ vs 1.890.000đ)
   ========================================================================== */
function initPricingToggle() {
  const toggleBtn = document.getElementById('pricingToggle');
  const labelMonthly = document.getElementById('labelMonthly');
  const labelYearly = document.getElementById('labelYearly');
  const standardPrice = document.getElementById('priceStandard');
  const standardUnit = document.getElementById('unitStandard');
  const enterprisePrice = document.getElementById('priceEnterprise');
  const enterpriseUnit = document.getElementById('unitEnterprise');

  if (!toggleBtn) return;

  let isYearly = false;

  function updatePricing() {
    if (isYearly) {
      toggleBtn.classList.add('active');
      labelYearly.classList.add('active');
      labelMonthly.classList.remove('active');

      if (standardPrice) standardPrice.textContent = '157.000₫';
      if (standardUnit) standardUnit.textContent = '/tháng (thanh toán năm: 1.890.000₫)';
      if (enterprisePrice) enterprisePrice.textContent = '1.600.000₫';
      if (enterpriseUnit) enterpriseUnit.textContent = '/tháng (tiết kiệm 4.800.000₫/năm)';
    } else {
      toggleBtn.classList.remove('active');
      labelMonthly.classList.add('active');
      labelYearly.classList.remove('active');

      if (standardPrice) standardPrice.textContent = '199.000₫';
      if (standardUnit) standardUnit.textContent = '/tháng (hủy bất kỳ lúc nào)';
      if (enterprisePrice) enterprisePrice.textContent = '2.000.000₫';
      if (enterpriseUnit) enterpriseUnit.textContent = '/tháng /Trung tâm';
    }
  }

  toggleBtn.addEventListener('click', () => {
    isYearly = !isYearly;
    updatePricing();
  });

  if (labelMonthly) labelMonthly.addEventListener('click', () => { isYearly = false; updatePricing(); });
  if (labelYearly) labelYearly.addEventListener('click', () => { isYearly = true; updatePricing(); });
}

/* ==========================================================================
   7. GENERAL CONSULTATION & WAITLIST FORM
   ========================================================================== */
function initConsultationForm() {
  const form = document.getElementById('consultationForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="fullname"]')?.value.trim();
    const phone = form.querySelector('[name="phone"]')?.value.trim();
    const role = form.querySelector('[name="role"]')?.value;
    const notes = form.querySelector('[name="notes"]')?.value.trim();

    if (!name || !phone) {
      showToast('Vui lòng điền đầy đủ họ tên và số điện thoại liên hệ!');
      return;
    }

    const lead = {
      name,
      phone,
      role,
      notes,
      timestamp: new Date().toLocaleString('vi-VN')
    };

    const savedLeads = JSON.parse(localStorage.getItem('edutrace_leads') || '[]');
    savedLeads.push(lead);
    localStorage.setItem('edutrace_leads', JSON.stringify(savedLeads));

    showToast(`Cảm ơn ${name}! Đội ngũ dự án EduTrace AI sẽ kết nối hỗ trợ bạn trong vòng 24h.`);
    form.reset();
  });
}

/* ==========================================================================
   8. TOAST NOTIFICATION UTILITY
   ========================================================================== */
function showToast(message) {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
    <span>${message}</span>
  `;

  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}
window.showToast = showToast;
