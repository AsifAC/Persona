// Loading Screen Component
export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #2b2b2b 100%)',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '20px' }}>Persona</h1>
        <div>Loading...</div>
      </div>
    </div>
  )
}

