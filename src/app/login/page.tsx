import { PinInput } from '@/components/login/pin-input';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💚</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Kkom-Morning
          </h1>
          <p className="text-gray-600">
            꼼이를 위한 아침 보살핌
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <PinInput />
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Made with 💚 by 우댕님
        </p>
      </div>
    </div>
  );
}
