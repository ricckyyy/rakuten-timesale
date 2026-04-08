import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">楽天タイムセール速報</h3>
            <p className="text-sm text-gray-400">
              楽天市場の最新タイムセール情報を毎日更新！
            </p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">カテゴリ</h3>
            <ul className="text-sm space-y-1">
              <li><Link href="/category/electronics" className="text-gray-400 hover:text-white">家電</Link></li>
              <li><Link href="/category/food" className="text-gray-400 hover:text-white">食品</Link></li>
              <li><Link href="/category/fashion" className="text-gray-400 hover:text-white">ファッション</Link></li>
              <li><Link href="/category/beauty" className="text-gray-400 hover:text-white">美容・コスメ</Link></li>
              <li><Link href="/category/books" className="text-gray-400 hover:text-white">本・CD・DVD</Link></li>
              <li><Link href="/category/sports" className="text-gray-400 hover:text-white">スポーツ・アウトドア</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">リンク</h3>
            <ul className="text-sm space-y-1">
              <li><Link href="/blog" className="text-gray-400 hover:text-white">ブログ・お買い物ガイド</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white">プライバシーポリシー</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-white">利用規約</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>© 2026 楽天タイムセール速報. All rights reserved.</p>
          <p className="mt-2 text-xs">
            当サイトは楽天アフィリエイトプログラムを利用しています。
          </p>
        </div>
      </div>
    </footer>
  );
}
