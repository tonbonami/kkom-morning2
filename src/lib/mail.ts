// 우댕 메일함으로 보내는 알림 메일(서버 전용). Gmail 앱 비밀번호로 우댕 계정에서 우댕에게 보낸다.
//   MAIL_USER          보내는 Gmail 주소
//   MAIL_APP_PASSWORD  그 계정의 앱 비밀번호(16자리, Google 계정 → 보안 → 앱 비밀번호)
//   MAIL_TO            받는 주소(없으면 MAIL_USER)
// 설정이 없으면 보내지 않고 false — 백업 파일 저장은 메일과 상관없이 된다.
import nodemailer from 'nodemailer';

export type MailAttachment = { filename: string; content: string | Buffer; contentType?: string };

export function mailConfigured(): boolean {
  return !!(process.env.MAIL_USER && process.env.MAIL_APP_PASSWORD);
}

export async function sendMail(m: { subject: string; text: string; html?: string; attachments?: MailAttachment[] }): Promise<boolean> {
  if (!mailConfigured()) return false;
  const user = process.env.MAIL_USER!;
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user, pass: process.env.MAIL_APP_PASSWORD!.replace(/\s+/g, '') },
  });
  try {
    await transport.sendMail({ from: `꼼모닝 <${user}>`, to: process.env.MAIL_TO || user, ...m });
    return true;
  } catch (e) {
    console.error('mail', e);
    return false;
  }
}
