import { ThirdwebProvider } from "@thirdweb-dev/react";
import { BaseMainnet } from "@thirdweb-dev/chains";

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider
      activeChain={BaseMainnet}
      clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID}
      supportedChains={[BaseMainnet]}
    >
      <Component {...pageProps} />
    </ThirdwebProvider>
  );
}

export default MyApp;
