((rust-ts-mode  .
   ((eglot-workspace-configuration .
      (:rust-analyzer
        ( :check (:command "clippy")
          :cargo ( :target "x86_64-unknown-linux-gnu"
                   :targetDir t)
          :hover (:show (:fields 10))))))))
