import { useEffect, useState } from "react";
import { displayName } from "../lib/profile.js";
export default function Avatar({ user, large = false }) {
  const name = displayName(user);
  const url = user.user_metadata?.avatar_url;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  return (
    <span className={`avatar ${large ? "avatar-large" : ""}`}>
      {typeof url === "string" && /^https:\/\//i.test(url) && !failed ? (
        <img
          src={url}
          alt={`Foto de ${name}`}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`Perfil de ${name}`}>
          {name.charAt(0).toLocaleUpperCase("pt-BR")}
        </span>
      )}
    </span>
  );
}
