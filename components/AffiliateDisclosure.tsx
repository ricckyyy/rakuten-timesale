export default function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 dark:text-gray-400 ${className}`.trim()}>
      広告：当サイトは楽天アフィリエイトを利用しています。リンクから購入された場合、
      当サイトが報酬を受け取ることがあります。購入価格は変わりません。
    </p>
  );
}
