import path from "path";
import { useEffect, useRef, useState } from "react";

export function RemoteAppLoader({
  app = {
    id: "myappid-001",
    name: "happy app",
    origin: `https://infinity-widget.vercel.app`,
  },
  user = null,
}: {
  app: {
    id: string;
    origin: string;
    name: string;
  };
  user: any;
}) {
  let ref = useRef(null);
  let [loading, setLoading] = useState<any>(
    <>
      <div className="w-full h-full flex justify-center items-center">
        <Spinner></Spinner>
        {` Loading...`}
      </div>
    </>,
  );

  useEffect(() => {
    let domain =
      process.env.NODE_ENV === "development"
        ? `http://localhost:3002`
        : `${app.origin}`;

    let basepath = `${domain}/generated/widget`;
    let manfiest = `${basepath}/manifest.json`;

    let clean = () => {};
    //
    fetch(`${manfiest}`, {
      mode: "cors",
      cache: "no-cache",
    })
      .then((r) => {
        return r.json();
      })
      .then((manfiestData) => {
        console.log(manfiestData);

        const widgetURL = path.join(basepath, manfiestData["widget.js"]);

        (window as any)
          .import2(`${widgetURL}`)
          .then((core: { install: any }) => {
            //
            console.log(core, ref.current);

            core
              .install({ domElement: ref.current, user, app })
              .then((v: () => void) => {
                clean = v;
                setLoading(null);
              })
              .catch((r: Error) => {
                console.log(r);
              });
          });
      })
      .catch((er) => {
        console.log(er);
      });
    //

    return () => {
      clean();
    };
  }, [app.origin, JSON.stringify({ user, app })]);

  return (
    <>
      {/*  */}
      {loading}
      <div className="w-full h-full" ref={ref}></div>
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
