import { PeprModule } from "pepr";
import cfg from "./package.json";
import { MinIOManager } from "./capabilities/minio-manager";

new PeprModule(cfg, [MinIOManager]);
