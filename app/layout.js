import './globals.css';

export const metadata = {
  title: 'Restaurant Ranker',
  description: 'Our collaborative restaurant rankings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
