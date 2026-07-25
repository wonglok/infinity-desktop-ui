import path from "path";
import { useEffect, useRef } from "react";

export function WidgetLoader({
  origin = `https://infinity-widget.vercel.app`,
}) {
  let ref = useRef(null);
  useEffect(() => {
    let domain =
      process.env.NODE_ENV === "development"
        ? `http://localhost:3002`
        : `${origin}`;

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
            // console.log(core, ref.current);
            //

            core
              .install({ domElement: ref.current })
              .then((v: () => void) => {
                clean = v;
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
  }, []);

  return (
    <>
      {/*  */}
      <div ref={ref}></div>
    </>
  );
}
