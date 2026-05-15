import './AnimatedFieldsBackground.css';

export default function AnimatedFieldsBackground({ enabled = true }) {
  return (
    <div
      aria-hidden="true"
      className={`animated-fields-background${enabled ? ' animated-fields-background--animated' : ' animated-fields-background--static'}`}
    >
      <svg
        className="animated-fields-background__svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1600 900"
      >
        <defs>
          <linearGradient id="fieldsSky" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#dcebf4" />
            <stop offset="100%" stopColor="#f6f1e6" />
          </linearGradient>

          <linearGradient id="fieldsHaze" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <pattern id="wheatTexture" width="84" height="84" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
            <rect width="84" height="84" fill="#cba754" />
            <path d="M6 12 C14 16, 20 28, 22 42" fill="none" stroke="rgba(255,245,204,0.45)" strokeWidth="3" />
            <path d="M28 6 C36 12, 42 28, 44 46" fill="none" stroke="rgba(255,245,204,0.34)" strokeWidth="3" />
            <path d="M58 14 C66 20, 70 36, 72 50" fill="none" stroke="rgba(255,245,204,0.3)" strokeWidth="3" />
          </pattern>

          <pattern id="sunflowerTexture" width="76" height="76" patternUnits="userSpaceOnUse">
            <rect width="76" height="76" fill="#d7bc4c" />
            <circle cx="18" cy="18" r="5" fill="rgba(99,76,27,0.22)" />
            <circle cx="54" cy="26" r="5" fill="rgba(99,76,27,0.22)" />
            <circle cx="30" cy="54" r="5" fill="rgba(99,76,27,0.18)" />
            <circle cx="62" cy="60" r="4" fill="rgba(99,76,27,0.18)" />
          </pattern>

          <pattern id="sproutsTexture" width="88" height="88" patternUnits="userSpaceOnUse" patternTransform="rotate(-10)">
            <rect width="88" height="88" fill="#98bc73" />
            <path d="M0 18 H88" stroke="rgba(217,242,193,0.3)" strokeWidth="3" />
            <path d="M0 42 H88" stroke="rgba(217,242,193,0.22)" strokeWidth="3" />
            <path d="M0 66 H88" stroke="rgba(217,242,193,0.18)" strokeWidth="3" />
          </pattern>

          <pattern id="fallowTexture" width="82" height="82" patternUnits="userSpaceOnUse" patternTransform="rotate(16)">
            <rect width="82" height="82" fill="#8e6d4d" />
            <path d="M0 18 H82" stroke="rgba(66,46,28,0.18)" strokeWidth="4" />
            <path d="M0 42 H82" stroke="rgba(66,46,28,0.18)" strokeWidth="4" />
            <path d="M0 66 H82" stroke="rgba(66,46,28,0.18)" strokeWidth="4" />
          </pattern>

          <pattern id="meadowTexture" width="92" height="92" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
            <rect width="92" height="92" fill="#7ea86b" />
            <path d="M10 10 C20 20, 22 34, 18 48" fill="none" stroke="rgba(203,232,183,0.26)" strokeWidth="3" />
            <path d="M44 10 C54 22, 56 36, 52 52" fill="none" stroke="rgba(203,232,183,0.22)" strokeWidth="3" />
            <path d="M76 12 C84 22, 86 36, 82 50" fill="none" stroke="rgba(203,232,183,0.18)" strokeWidth="3" />
          </pattern>

          <filter id="cloudBlur">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>

        <rect fill="url(#fieldsSky)" height="900" width="1600" x="0" y="0" />
        <ellipse cx="1230" cy="135" fill="rgba(255,226,162,0.28)" rx="128" ry="74" />
        <rect fill="url(#fieldsHaze)" height="220" width="1600" x="0" y="170" />

        <g className="fields-cloud fields-cloud--one" filter="url(#cloudBlur)">
          <ellipse cx="250" cy="120" fill="rgba(255,255,255,0.72)" rx="72" ry="24" />
          <ellipse cx="320" cy="108" fill="rgba(255,255,255,0.84)" rx="56" ry="20" />
          <ellipse cx="372" cy="124" fill="rgba(255,255,255,0.68)" rx="46" ry="18" />
        </g>

        <g className="fields-cloud fields-cloud--two" filter="url(#cloudBlur)">
          <ellipse cx="1120" cy="170" fill="rgba(255,255,255,0.62)" rx="64" ry="20" />
          <ellipse cx="1182" cy="160" fill="rgba(255,255,255,0.82)" rx="54" ry="18" />
          <ellipse cx="1232" cy="176" fill="rgba(255,255,255,0.58)" rx="40" ry="15" />
        </g>

        <g className="fields-land">
          <path d="M0 310 C220 240, 420 245, 640 286 C905 336, 1170 312, 1600 244 V900 H0 Z" fill="#a6bc7a" opacity="0.22" />

          <g className="fields-parcel fields-parcel--1">
            <path d="M0 408 L238 360 L378 444 L302 628 L88 648 L0 566 Z" fill="url(#sproutsTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--2">
            <path d="M238 360 L548 320 L678 426 L566 616 L302 628 L378 444 Z" fill="url(#wheatTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--3">
            <path d="M548 320 L880 282 L1016 420 L904 592 L566 616 L678 426 Z" fill="url(#sunflowerTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--4">
            <path d="M880 282 L1232 254 L1350 418 L1202 578 L904 592 L1016 420 Z" fill="url(#fallowTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--5">
            <path d="M1232 254 L1600 244 L1600 448 L1460 614 L1202 578 L1350 418 Z" fill="url(#meadowTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--6">
            <path d="M88 648 L302 628 L508 734 L432 900 L0 900 L0 566 Z" fill="url(#fallowTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--7">
            <path d="M302 628 L566 616 L784 726 L712 900 L432 900 L508 734 Z" fill="url(#sproutsTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--8">
            <path d="M566 616 L904 592 L1108 720 L1034 900 L712 900 L784 726 Z" fill="url(#wheatTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--9">
            <path d="M904 592 L1202 578 L1438 730 L1398 900 L1034 900 L1108 720 Z" fill="url(#sunflowerTexture)" />
          </g>
          <g className="fields-parcel fields-parcel--10">
            <path d="M1202 578 L1460 614 L1600 716 L1600 900 L1398 900 L1438 730 Z" fill="url(#meadowTexture)" />
          </g>

          <g className="fields-boundaries">
            <path d="M238 360 L378 444 L302 628" />
            <path d="M548 320 L678 426 L566 616" />
            <path d="M880 282 L1016 420 L904 592" />
            <path d="M1232 254 L1350 418 L1202 578" />
            <path d="M302 628 L508 734 L432 900" />
            <path d="M566 616 L784 726 L712 900" />
            <path d="M904 592 L1108 720 L1034 900" />
            <path d="M1202 578 L1438 730 L1398 900" />
            <path d="M88 648 L302 628 L566 616 L904 592 L1202 578 L1460 614" />
            <path d="M0 408 L238 360 L548 320 L880 282 L1232 254 L1600 244" />
          </g>

          <g className="fields-road-network">
            <path d="M-40 514 C150 478, 284 478, 422 518 C574 564, 690 580, 890 558 C1078 536, 1228 540, 1640 630" />
            <path d="M462 264 C480 404, 546 500, 686 616 C802 712, 832 804, 818 948" />
          </g>
        </g>
      </svg>
    </div>
  );
}
