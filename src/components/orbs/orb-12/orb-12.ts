import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb12Orb } from "@/components/orbs/orb-12/meta";

export { meta, orb12Orb } from "@/components/orbs/orb-12/meta";

@Component({
  selector: "orb-12",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb12 extends OrbBase {
  override readonly variant = orb12Orb;
}
