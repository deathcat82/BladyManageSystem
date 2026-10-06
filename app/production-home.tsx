export default function ProductionHome() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <p className="eyebrow">Lulu Studio紋繡美學</p>
        <h1>把每一份信任<br />好好保存下來。</h1>
        <p className="landing-copy">
          正式客戶管理、預約行事曆、服務紀錄與一次性同意書系統。
          管理端僅限已授權的工作室帳號登入。
        </p>
        <a className="button primary landing-login" href="/admin">進入管理端</a>
        <p className="login-help">使用已授權的 Email 接收 Cloudflare Access 單次驗證碼。</p>
        <div className="landing-trust">
          <span>Access 身分驗證</span>
          <span>一次性表單</span>
          <span>私有簽名保存</span>
          <span>操作稽核</span>
        </div>
      </section>
      <section className="how-grid" aria-label="使用流程">
        <article><b>01</b><h2>安全登入</h2><p>只有已加入允許名單的工作室 Email 可以進入管理端。</p></article>
        <article><b>02</b><h2>建立同意書</h2><p>產生一次性網址，傳送給客戶完成資料與簽名。</p></article>
        <article><b>03</b><h2>服務追蹤</h2><p>集中管理客戶、預約、服務紀錄與保養關心事項。</p></article>
      </section>
      <p className="landing-footer"><a href="/privacy">隱私與個資告知</a></p>
    </main>
  );
}
