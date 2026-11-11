import Link from 'next/link'

const members = [
  { initials: 'VM', name: 'Vũ Đức Minh', role: 'Trưởng dự án & nghiên cứu' },
  { initials: 'MT', name: 'Đặng Minh Tuấn', role: 'Phụ trách lập trình' },
  { initials: 'NT', name: 'Nguyễn Phương Thảo', role: 'Phụ trách tài chính' },
  { initials: 'VT', name: 'Vincent Tristan', role: 'Phụ trách truyền thông' },
]

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="eyebrow">TRADITIONAL PARTNERSHIP · LÀNG NGHỀ VIỆT NAM</p>
            <h1 id="landing-title">Gìn giữ tinh hoa.<br />Mở lối tương lai.</h1>
          <p className="hero-lede">
            Một không gian chung để gìn giữ câu chuyện làng nghề, hỗ trợ nghệ nhân phát triển và đưa những tác phẩm thủ công đến gần hơn với khách hàng.
          </p>
          <a className="text-link" href="#mission">Khám phá sứ mệnh <span aria-hidden="true">↘</span></a>
        </div>
        <div className="hero-paths" aria-label="Chọn không gian phù hợp">
          <p className="eyebrow">BẠN ĐẾN ĐÂY VỚI VAI TRÒ</p>
          <Link className="path-card path-customer" href="/shop">
            <span className="path-number">01</span>
            <span className="path-title">Khám phá tác phẩm</span>
            <span className="path-description">Ghé thăm gian hàng và tìm món đồ thủ công dành riêng cho bạn.</span>
            <span className="path-action">Đến cửa hàng <span aria-hidden="true">↗</span></span>
          </Link>
          <Link className="path-card path-seller" href="/seller/sign-in">
            <span className="path-number">02</span>
            <span className="path-title">Dành cho nghệ nhân</span>
            <span className="path-description">Quản lý sản phẩm, chi phí và đơn hàng của xưởng.</span>
            <span className="path-action">Vào không gian người bán <span aria-hidden="true">↗</span></span>
          </Link>
        </div>
      </section>

      <section id="mission" className="story-section" aria-labelledby="mission-title">
        <div className="section-heading">
          <p className="eyebrow">ĐIỀU CHÚNG TÔI TIN</p>
          <h2 id="mission-title">Giữ gìn giá trị.<br />Mở rộng cơ hội.</h2>
        </div>
        <div className="mission-copy">
          <p>
            Traditional Partnership đồng hành cùng các nghệ nhân độc lập và cơ sở thủ công quy mô nhỏ tại Việt Nam, đặc biệt những cộng đồng còn hạn chế nguồn lực. Chúng tôi phát triển công cụ quản lý tài chính dễ tiếp cận, hỗ trợ quảng bá và tạo thêm cơ hội kết nối thương mại — để mỗi xưởng có thể phát triển bền vững mà vẫn gìn giữ giá trị văn hóa trong nghề.
          </p>
          <p className="draft-note">Giai đoạn đầu tập trung tại Hà Nội; tầm nhìn dài hạn là mở rộng kết nối tới Hội An, Sa Pa và những vùng nghề giàu bản sắc trên cả nước.</p>
        </div>
      </section>

      <section className="project-pillars" aria-labelledby="pillars-title">
        <div className="pillars-intro">
          <p className="eyebrow">TRỌNG TÂM CỦA DỰ ÁN</p>
          <h2 id="pillars-title">Một nền tảng.<br />Nhiều cơ hội phát triển.</h2>
          <p>Từ sổ sách rõ ràng đến câu chuyện sản phẩm hấp dẫn, giải pháp được xây dựng theo nhu cầu thực tế của các cơ sở thủ công nhỏ.</p>
        </div>
        <div className="pillar-list">
          <article className="pillar-card"><span className="pillar-index">01</span><div><h3>Tài chính dễ tiếp cận</h3><p>Theo dõi doanh thu, chi phí và hiệu quả sản phẩm bằng quy trình gọn nhẹ, dễ sử dụng.</p></div></article>
          <article className="pillar-card"><span className="pillar-index">02</span><div><h3>Định giá có cơ sở</h3><p>Kết hợp chi phí vật liệu, công lao động và dữ liệu cung cầu trong chính marketplace.</p></div></article>
          <article className="pillar-card"><span className="pillar-index">03</span><div><h3>Kết nối thương mại</h3><p>Giúp nghệ nhân kể câu chuyện của xưởng, gặp gỡ khách hàng và kết nối cộng tác viên phù hợp.</p></div></article>
        </div>
      </section>

      <section className="impact-section" aria-labelledby="impact-title">
        <div className="impact-heading">
          <p className="eyebrow">MỤC TIÊU TẠO TÁC ĐỘNG</p>
          <h2 id="impact-title">Đồng hành bằng kết quả có thể đo lường.</h2>
        </div>
        <div className="impact-grid">
          <article><strong>03</strong><span>cơ sở thủ công dự kiến được kết nối</span></article>
          <article><strong>80%</strong><span>đơn vị đối tác hướng tới áp dụng hệ thống theo dõi tài chính</span></article>
          <article><strong>60%</strong><span>mục tiêu có cải thiện đo lường được ở ít nhất một chỉ số kinh doanh</span></article>
          <article><strong>20–30%</strong><span>mục tiêu tăng trưởng doanh thu cho các cơ sở đối tác</span></article>
        </div>
        <p className="impact-note">Đây là mục tiêu của dự án, không phải kết quả đã đạt được.</p>
      </section>

      <section id="community" className="community-section" aria-labelledby="community-title">
        <div className="community-intro">
          <p className="eyebrow">CON NGƯỜI LÀM NÊN CỘNG ĐỒNG</p>
          <h2 id="community-title">Những người<br />đứng sau dự án.</h2>
          <p>Nhóm kết hợp các năng lực nghiên cứu, phát triển công cụ tài chính, lập trình và truyền thông cộng đồng.</p>
        </div>
        {members.length ? (
          <div className="member-grid">
            {members.map((member) => (
              <article className="member-card" key={member.name}>
                <span className="member-avatar" aria-hidden="true">{member.initials}</span>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="member-empty">
            <span className="member-mark" aria-hidden="true">TP</span>
            <p>Không dùng hồ sơ giả. Chúng tôi sẽ giới thiệu đúng những thành viên bạn gửi.</p>
          </div>
        )}
      </section>

      <section className="closing-cta" aria-label="Bắt đầu">
        <div>
          <p className="eyebrow">MỘT CỘNG ĐỒNG ĐANG LỚN LÊN</p>
          <h2>Bắt đầu từ một câu chuyện thủ công.</h2>
        </div>
        <Link className="button button-light" href="/shop">Xem gian hàng <span aria-hidden="true">↗</span></Link>
      </section>
    </main>
  )
}
