import { Component } from "@angular/core";

import { ORB_TEMPLATE, OrbBase } from "@/components/orbs/orb-base";
import { ShaderOrb } from "@/components/orbs/canvas";
import { orb21Orb } from "@/components/orbs/orb-21/meta";

export { meta, orb21Orb } from "@/components/orbs/orb-21/meta";

@Component({
  selector: "orb-21",
  imports: [ShaderOrb],
  template: ORB_TEMPLATE,
})
export class Orb21 extends OrbBase {
  override readonly variant = orb21Orb;
}
