export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          プライバシーポリシー
        </h1>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              個人情報の取り扱いについて
            </h2>
            <p>
              当サイト「楽天タイムセール速報」（以下、「当サイト」）では、
              ユーザーの個人情報を適切に保護することを重要な責務と考えています。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              収集する情報
            </h2>
            <p>
              当サイトでは、以下の情報を収集する場合があります：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>アクセス解析情報（Googleアナリティクス等）</li>
              <li>Cookie情報</li>
              <li>閲覧履歴</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              アフィリエイトプログラムについて
            </h2>
            <p>
              当サイトは、楽天アフィリエイトプログラムに参加しています。
              商品リンクをクリックして購入された場合、当サイトに紹介料が支払われます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              免責事項
            </h2>
            <p>
              当サイトで提供する情報は、できる限り正確な情報を掲載するよう努めておりますが、
              正確性や安全性を保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              お問い合わせ
            </h2>
            <p>
              プライバシーポリシーに関するお問い合わせは、
              楽天市場の公式サイトよりお願いいたします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
