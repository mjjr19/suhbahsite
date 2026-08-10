interface RegistrationConfirmationEmailProps {
  parentName: string;
  players: string[];
  programTitle: string;
  amountFormatted: string;
}

export function RegistrationConfirmationEmail({
  parentName,
  players,
  programTitle,
  amountFormatted,
}: RegistrationConfirmationEmailProps) {
  const playersFormatted =
    players.length > 1
      ? `${players.slice(0, -1).join(", ")} and ${players[players.length - 1]}`
      : players[0];

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        maxWidth: 480,
        margin: "0 auto",
        color: "#1f2937",
      }}
    >
      <h1 style={{ color: "#6a9a56", fontSize: 22 }}>
        You&rsquo;re registered, {parentName}!
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6 }}>
        Thank you for registering <strong>{playersFormatted}</strong> for{" "}
        <strong>{programTitle}</strong> with Suhbah Soccer.
      </p>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          margin: "24px 0",
          fontSize: 14,
        }}
      >
        <tbody>
          <tr>
            <td style={{ padding: "8px 0", color: "#6b7280" }}>
              {players.length > 1 ? "Players" : "Player"}
            </td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>{playersFormatted}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", color: "#6b7280" }}>Program</td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>{programTitle}</td>
          </tr>
          <tr>
            <td style={{ padding: "8px 0", color: "#6b7280" }}>Amount Paid</td>
            <td style={{ padding: "8px 0", textAlign: "right" }}>
              {amountFormatted}
            </td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#6b7280" }}>
        Where Football Meets Faith. Questions? Reply to this email or reach us
        at suhbahsoccer@gmail.com.
      </p>
    </div>
  );
}
