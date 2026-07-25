import path from "path";
import { ReactElement, ReactNode, useEffect, useRef, useState } from "react";

let domain =
  process.env.NODE_ENV === "development" ? `http://localhost:3002` : ``;

let basepath = `${domain}/generated/widget`;

let manfiest = `${basepath}/manifest.json`;

export function WidgetLoader({}) {
  let ref = useRef(null);
  useEffect(() => {
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
