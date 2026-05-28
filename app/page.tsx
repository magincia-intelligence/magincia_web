import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-cream">
      <main className="flex flex-1 w-full flex-col items-center justify-center px-8 py-24 text-center">
        <Image
          src="/magincia_banner.png"
          alt="Magincia Intelligence — Education Market Intelligence | Insight. Clarity. Advantage."
          width={900}
          height={300}
          priority
          className="w-full max-w-3xl h-auto"
        />
      </main>
    </div>
  );
}
