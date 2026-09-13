import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb32Orb } from "@/components/orbs/orb-32/meta";

export { meta, orb32Orb } from "@/components/orbs/orb-32/meta";

@Component({
  selector: "orb-32",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb32 extends OrbBase {
  override readonly variant = orb32Orb;
}
