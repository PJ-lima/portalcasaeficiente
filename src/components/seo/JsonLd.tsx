/**
 * Injeta structured data.
 *
 * O `<` é escapado para `<`: um `</script>` vindo de campo de texto do
 * programa (summary, statusNote) fecharia a tag e permitiria injeção de HTML.
 * A escape sequence continua a ser JSON válido, portanto o payload faz parse na
 * mesma.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}
