export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-2xl mx-auto font-sans">
      <h1 className="font-serif text-3xl text-primary mb-6">Terminos de Servicio</h1>
      <p className="text-muted-foreground text-sm mb-4">Ultima actualizacion: Mayo 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Edad minima</h2>
          <p>Debes tener al menos 18 anos de edad para usar AuraSecret, ya sea como usuario o como creador de contenido. Al registrarte, confirmas bajo protesta de decir verdad que cumples con este requisito. Nos reservamos el derecho de suspender cualquier cuenta que incumpla esta condicion.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Naturaleza del servicio</h2>
          <p>AuraSecret es una plataforma de entretenimiento digital que conecta usuarios con companeras virtuales (inteligencia artificial) y creadoras de contenido independientes. AuraSecret actua unicamente como intermediario tecnologico.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Contenido</h2>
          <p>Las creadoras son responsables del contenido que suben. Queda prohibido subir contenido que involucre menores de edad, violencia, o cualquier material ilegal. AuraSecret se reserva el derecho de eliminar contenido y suspender cuentas que violen esta politica.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Pagos</h2>
          <p>Los pagos se procesan a traves de Stripe. AuraSecret cobra una comision del 20% sobre las ventas de contenido. Las creadoras reciben el 80% restante directamente en su cuenta bancaria vinculada. Los pagos de suscripcion y desbloqueo de galeria no son reembolsables.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Interacciones con IA</h2>
          <p>Las companeras virtuales impulsadas por inteligencia artificial son personajes ficticios. Sus respuestas son generadas automaticamente y no constituyen consejo profesional de ningun tipo.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Privacidad</h2>
          <p>Recopilamos datos necesarios para el funcionamiento del servicio: identificador de Telegram, nombre, preferencias y historial de conversaciones. No vendemos datos personales a terceros. Los datos se almacenan de forma segura en servidores protegidos.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">7. Suspension de cuenta</h2>
          <p>Nos reservamos el derecho de suspender o eliminar cuentas que violen estos terminos, incluyendo pero no limitado a: registro con edad falsa, contenido ilegal, fraude, o comportamiento abusivo.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contacto</h2>
          <p>Para preguntas sobre estos terminos, contactanos a traves de nuestro bot de Telegram: @AuraSecretx_bot</p>
        </section>
      </div>
    </div>
  );
}
