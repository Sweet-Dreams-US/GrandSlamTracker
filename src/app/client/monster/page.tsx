import ClientPasswordGate from '@/components/test-clients/ClientPasswordGate'
import MonsterScenario from '@/components/test-clients/MonsterScenario'

export default function MonsterClientPage() {
  return (
    <ClientPasswordGate clientName="Monster Remodeling" correctUsername="monster" correctPassword="Monst3rR3mod3ling!">
      <MonsterScenario mode="client" />
    </ClientPasswordGate>
  )
}
