export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          利用規約
        </h1>

        <div className="prose max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              サービスについて
            </h2>
            <p>
              当サイト「楽天タイムセール速報」は、楽天市場のタイムセール情報を
              まとめて提供する情報サイトです。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              利用条件
            </h2>
            <p>
              当サイトの利用にあたっては、以下の条件に同意したものとみなします：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>提供される情報は参考情報であり、最終的な購入判断はユーザー自身で行うこと</li>
              <li>セール情報は変更される可能性があること</li>
              <li>商品の詳細や在庫状況は楽天市場でご確認ください</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              禁止事項
            </h2>
            <p>
              当サイトの利用にあたり、以下の行為を禁止します：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>法令または公序良俗に違反する行為</li>
              <li>当サイトの運営を妨害する行為</li>
              <li>当サイトのコンテンツを無断で転載・複製する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              免責事項
            </h2>
            <p>
              当サイトの利用により発生したいかなる損害についても、
              当サイト運営者は一切の責任を負いません。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
