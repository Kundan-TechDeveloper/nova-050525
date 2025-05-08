import { MessageInput } from "./message-input"

interface WelcomeProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function Welcome({ onSendMessage, disabled }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="w-full max-w-[800px] mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold mb-3">Welcome</h1>
          <p className="text-xl text-zinc-400">How can I help you today?</p>
        </div>
        <div className="w-full">
          <MessageInput onSend={onSendMessage} isInitial={true} />
        </div>
      </div>
    </div>
  )
}
