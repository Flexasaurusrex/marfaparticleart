import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Base } from "@thirdweb-dev/chains";

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider
      activeChain={Base}
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      supportedChains={[Base]}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
