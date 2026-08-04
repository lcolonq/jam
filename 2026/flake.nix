{
  inputs = {
    teleia.url = "github:lcolonq/teleia";
    nixpkgs.follows = "teleia/nixpkgs";
  };

  outputs = inputs@{ self, nixpkgs, ... }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
      jam = inputs.teleia.native.build ./. "jam";
      windows = inputs.teleia.windows.build ./. "jam";
      nonnix = pkgs.stdenv.mkDerivation {
        name = "jam-nonnix";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir $out
          cp -rv ${jam}/bin/jam_server $out
          chmod +w $out/jam_server
          patchelf --remove-rpath $out/jam_server
          patchelf --set-interpreter /lib64/ld-linux-x86-64.so.2 $out/jam_server
          strip $out/jam_server
          chmod -w $out/jam_server
        '';
      };
      jam2026Games = pkgs.stdenv.mkDerivation {
        name = "jam2026-games";
        phases = [ "installPhase" ];
        installPhase = ''
          mkdir $out
          cp -rv ${./games} $out/games
        '';
      };
      jam2026Module = { config, lib, ... }:
        let
          cfg = config.colonq.services.jam2026;
        in {
          options.colonq.services.jam2026 = {
            enable = lib.mkEnableOption "Enable the Jam 2026 server";
          };
          config = lib.mkIf cfg.enable {
            users.users.jam2026 = {
              isSystemUser = true;
              group = "jam2026";
            };
            users.groups.jam2026 = {};
            systemd.services."colonq.jam2026" = {
              after = ["network-online.target"];
              wantedBy = ["network-online.target"];
              serviceConfig = {
                User = "jam2026";
                Restart = "on-failure";
                ExecStart = "${jam}/bin/jam_server --no-browser";
                WorkingDirectory = "${jam2026Games}";
              };
            };
          };
        };
    in {
      packages.${system} = {
        inherit jam windows nonnix jam2026Games;
        default = jam;
      };
      applications.${system}.default = {
        type = "app";
        program = "${jam}/bin/jam_server";
      };
      devShells.${system}.default = inputs.teleia.shell.overrideAttrs (final: prev: {
        buildInputs = prev.buildInputs;
      });
      nixosModules = {
        jam2026 = jam2026Module;
      };
    };
}
