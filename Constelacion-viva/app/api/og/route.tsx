import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ed7417",
        backgroundImage:
          "radial-gradient(circle at 25px 25px, #f19045 2%, transparent 0%), radial-gradient(circle at 75px 75px, #f4ac74 2%, transparent 0%)",
        backgroundSize: "100px 100px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(6, 0, 0, 0.8)",
          padding: "60px 80px",
          borderRadius: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "72px",
            fontWeight: "bold",
            color: "#ffffff",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Constelación Viva
        </h1>
        <p
          style={{
            fontSize: "32px",
            color: "#fbe3d1",
            textAlign: "center",
          }}
        >
          Red de Terapeutas Holísticos
        </p>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
