import { Link as TanLink } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
};

/** next/link shim */
export default function Link({ href, children, className, ...rest }: Props) {
  // External or hash — plain anchor
  if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }
  // TanStack typed routes are strict; cast for Poel dynamic paths
  return (
    <TanLink to={href as "/"} className={className} {...(rest as object)}>
      {children}
    </TanLink>
  );
}
