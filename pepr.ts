import { PeprModule } from "pepr";
import cfg from "./package.json";
import { manager } from "./capabilities/minio-manager";

new PeprModule(cfg, [manager]);
