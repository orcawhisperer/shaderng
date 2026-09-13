import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb33Orb } from "@/components/orbs/orb-33/meta";

export { meta, orb33Orb } from "@/components/orbs/orb-33/meta";

@Component({
  selector: "orb-33",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb33 extends OrbBase {
  override readonly variant = orb33Orb;
}
