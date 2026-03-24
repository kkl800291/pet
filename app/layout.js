import './globals.css';

export const metadata = {
  title: 'Pet Loop',
  description: '宠物主题社区 MVP'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
