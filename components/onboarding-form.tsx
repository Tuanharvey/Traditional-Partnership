import { saveSellerProfile } from '@/app/actions/seller'

type OnboardingFormProps = {
  issue?: string
}

export function OnboardingForm({ issue }: OnboardingFormProps) {
  return (
    <section className="onboarding-layout" aria-label="Thiết lập gian hàng">
      <section className="onboarding-intro">
        <p className="eyebrow">BƯỚC 01 · THIẾT LẬP GIAN HÀNG</p>
        <h1>Hãy bắt đầu bằng câu chuyện của xưởng.</h1>
        <p>Thông tin này giúp khách hàng hiểu ai là người làm nên những tác phẩm họ yêu thích.</p>
      </section>
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <h2 id="onboarding-title">Thông tin gian hàng</h2>
        {issue ? <p className="form-error" role="alert">Vui lòng kiểm tra lại các thông tin đã nhập.</p> : null}
        <form action={saveSellerProfile} className="form-stack">
          <div className="field">
            <label htmlFor="shop-name">Tên gian hàng</label>
            <input id="shop-name" name="shopName" minLength={2} maxLength={100} placeholder="Ví dụ: Gốm nhà An" required />
          </div>
          <div className="field">
            <label htmlFor="shop-bio">Đôi nét về xưởng</label>
            <textarea id="shop-bio" name="bio" rows={4} maxLength={500} placeholder="Bạn làm nghề gì, ở đâu và điều gì làm nên nét riêng của xưởng?" />
          </div>
          <div className="field">
            <label htmlFor="shop-phone">Số điện thoại liên hệ</label>
            <input id="shop-phone" name="contactPhone" type="tel" autoComplete="tel" maxLength={32} placeholder="Số điện thoại để khách liên hệ" />
          </div>
          <button className="button button-primary button-full" type="submit">Lưu thông tin và xem hướng dẫn</button>
        </form>
      </section>
    </section>
  )
}
