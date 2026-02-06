import PinInput from '@/components/login/pin-input';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-accent to-primary">
      <div className="text-center mb-12">
        <h1 className="text-6xl mb-4">💚</h1>
        <h2 className="text-4xl font-headline font-bold text-gray-800">Kkom-Morning</h2>
        <p className="mt-2 text-base text-gray-700">꼬미의 아침을 여는 따뜻한 보살핌</p>
      </div>
      <PinInput />
    </div>
  );
}
