import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendNewUserAdminNotification(user: { email: string; full_name: string; company?: string }) {
  try {
    const info = await transporter.sendMail({
      from: `"Inspiring HR LMS" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'LMS - Có người dùng mới đăng ký cần phê duyệt',
      html: `
        <h2>Người dùng mới đăng ký</h2>
        <p>Hệ thống vừa ghi nhận một người dùng mới đang chờ phê duyệt:</p>
        <ul>
          <li><strong>Họ tên:</strong> ${user.full_name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Công ty:</strong> ${user.company || 'Không có'}</li>
        </ul>
        <p>Vui lòng đăng nhập vào trang Quản trị để duyệt tài khoản.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/admin/users">Chuyển đến trang Quản lý Người dùng</a></p>
      `,
    })
    console.log('Admin notification sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending admin notification email:', error)
  }
}

export async function sendUserApprovedEmail(userEmail: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Inspiring HR LMS" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'LMS - Tài khoản của bạn đã được phê duyệt',
      html: `
        <h2>Chúc mừng!</h2>
        <p>Tài khoản của bạn trên hệ thống Inspiring HR LMS đã được Quản trị viên phê duyệt.</p>
        <p>Bây giờ bạn có thể đăng nhập và bắt đầu trải nghiệm các khóa học.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login">Đăng nhập ngay</a></p>
      `,
    })
    console.log('Approved email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending approved email:', error)
  }
}

export async function sendUserRejectedEmail(userEmail: string, reason: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Inspiring HR LMS" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'LMS - Thông báo về tài khoản của bạn',
      html: `
        <h2>Thông báo từ Ban Quản trị</h2>
        <p>Rất tiếc, yêu cầu đăng ký tài khoản của bạn không được phê duyệt vào lúc này.</p>
        <p><strong>Lý do:</strong> ${reason}</p>
        <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ Hotline: <strong>0915099642</strong> để được hỗ trợ.</p>
        <p>Trân trọng,<br/>Inspiring HR Team</p>
      `,
    })
    console.log('Rejected email sent: %s', info.messageId)
  } catch (error) {
    console.error('Error sending rejected email:', error)
  }
}
