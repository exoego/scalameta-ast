"use strict";

import { ScalametaAstMainScalafixCompat } from "./scalafix-compat/main.js";

import { ScalametaAstMainLatest } from "./latest/main.js";

$(() => {
  [ScalametaAstMainLatest, ScalametaAstMainScalafixCompat].forEach((main) => {
    try {
      // force initialize for avoid error
      main.convert("", true, "", "", "", false, "", "", "", false, false);
    } catch (e) {
      console.log(e);
    }
  });

  const headerAllConfig = document.getElementById("header_all_scalafix_config");
  headerAllConfig.addEventListener("toggle", (event) => {
    const summary = headerAllConfig.getElementsByTagName("summary")[0];
    if (headerAllConfig.open) {
      summary.innerHTML = "close header";
    } else {
      summary.innerHTML = "open header";
    }
  });

  $("#format_input").click(() => {
    const input = $("#input_scala").val();
    const scalafmt = $("#scalafmt").val();
    const main =
      $("#scalameta").val() == "latest"
        ? ScalametaAstMainLatest
        : ScalametaAstMainScalafixCompat;
    const result = main.format(input, scalafmt);
    if (input != result) {
      $("#input_scala").val(result);
    }
  });

  $("#clear_local_storage").click(() => localStorage.clear());

  const run = () => {
    try {
      const scalafmt = $("#scalafmt").val();
      const input = $("#input_scala").val();
      const outputType = $("input[name=output_type]:checked").val();
      const packageName = $("#package").val();
      const ruleName = $("#rule_name").val();
      const dialect = $("#dialect").val();
      const scalameta = $("#scalameta").val();
      const main =
        scalameta == "latest"
          ? ScalametaAstMainLatest
          : ScalametaAstMainScalafixCompat;
      const patch = $("#patch").val();

      ["package", "rule_name", "wildcard_import", "patch"].forEach((i) =>
        $(`#${i}`).prop(
          "disabled",
          outputType === "raw" || outputType === "tokens",
        ),
      );

      const r = main.convert(
        input,
        $("#format").prop("checked") === true,
        scalafmt,
        outputType === undefined ? "" : outputType,
        packageName === undefined ? "" : packageName,
        $("#wildcard_import").prop("checked") === true,
        ruleName === undefined ? "" : ruleName,
        dialect === undefined ? "" : dialect,
        patch === undefined ? "" : patch,
        $("#remove_new_fields").prop("checked") === true,
        $("#initial_extractor").prop("checked") === true,
      );
      $("#output_scala").text(r.ast);
      $("#info")
        .text(`ast: ${r.astBuildMs} ms\nfmt: ${r.formatMs} ms`)
        .addClass("alert-success")
        .removeClass("alert-danger");

      const saveLimit = 1024;

      [
        ["patch", patch],
        ["scalameta", scalameta],
        ["dialect", dialect],
        ["rule_name", ruleName],
        ["package", packageName],
        ["output_type", outputType],
      ].forEach((xs) => {
        try {
          localStorage.setItem(xs[0], xs[1]);
        } catch (e) {
          console.trace(e);
        }
      });

      if (input.length < saveLimit) {
        try {
          localStorage.setItem("source", input);
        } catch (e) {
          console.trace(e);
        }
      }
      if (scalafmt.length < saveLimit) {
        try {
          localStorage.setItem("scalafmt", scalafmt);
        } catch (e) {
          console.trace(e);
        }
      }

      hljs.highlightAll();
    } catch (e) {
      console.trace(e);
      $("#output_scala").text("");
      $("#info").text(e).addClass("alert-danger").removeClass("alert-success");
    }
  };

  document.getElementById("output_scala").addEventListener("dblclick", (e) => {
    const s = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(e.target);
    s.removeAllRanges();
    s.addRange(r);
  });

  $("#input_scala").keyup((event) => run());

  $("#package").keyup((event) => run());

  $("#rule_name").keyup((event) => run());

  $("input[name=output_type]").on("change", () => run());

  $("#dialect").change(() => run());

  $("#patch").change(() => run());

  $("#scalameta").change(() => run());

  $("#format").change(() => {
    run();
    localStorage.setItem(
      "format",
      ($("#format").prop("checked") === true).toString(),
    );
  });

  $("#wildcard_import").change(() => {
    run();
    localStorage.setItem(
      "wildcard_import",
      ($("#wildcard_import").prop("checked") === true).toString(),
    );
  });

  $("#remove_new_fields").change(() => {
    run();
    localStorage.setItem(
      "remove_new_fields",
      ($("#remove_new_fields").prop("checked") === true).toString(),
    );
  });

  $("#initial_extractor").change(() => {
    run();
    localStorage.setItem(
      "initial_extractor",
      ($("#initial_extractor").prop("checked") === true).toString(),
    );
  });

  $(document).ready(() => {
    hljs.addPlugin(new CopyButtonPlugin());

    const savedSource = localStorage.getItem("source");
    const savedScalafmt = localStorage.getItem("scalafmt");
    const savedPackage = localStorage.getItem("package");
    const savedRuleName = localStorage.getItem("rule_name");
    const savedDialect = localStorage.getItem("dialect");
    const savedScalameta = localStorage.getItem("scalameta");
    const savedPatch = localStorage.getItem("patch");

    if (savedScalameta != null) {
      $(`[name="scalameta"] option[value="${savedScalameta}"]`).prop(
        "selected",
        true,
      );
    }

    if (savedPatch != null) {
      $(`[name="patch"] option[value="${savedPatch}"]`).prop("selected", true);
    }

    if (savedDialect != null) {
      $(`[name="dialect"] option[value="${savedDialect}"]`).prop(
        "selected",
        true,
      );
    }

    if (savedPackage != null) {
      $("#rule_name").val(savedRuleName);
    }

    if (savedPackage != null) {
      $("#package").val(savedPackage);
    } else {
      $("#package").val("fix");
    }

    if (savedScalafmt != null) {
      $("#scalafmt").val(savedScalafmt);
    } else {
      const defaultConfig = `
        maxColumn = 50
        runner.dialect = "Scala3"
        align.preset = "none"
        continuationIndent.defnSite = 2
        continuationIndent.extendSite = 2
      `
        .split("\n")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .join("\n");
      $("#scalafmt").val(defaultConfig);
    }

    if (savedSource != null) {
      $("#input_scala").val(savedSource);
    } else {
      $("#input_scala").val("def a = b");
    }

    if (localStorage.getItem("format") === "false") {
      $("#format").prop("checked", false);
    }

    if (localStorage.getItem("wildcard_import") === "true") {
      $("#wildcard_import").prop("checked", true);
    }

    if (localStorage.getItem("remove_new_fields") === "false") {
      $("#remove_new_fields").prop("checked", false);
    }

    if (localStorage.getItem("initial_extractor") === "true") {
      $("#initial_extractor").prop("checked", true);
    }

    switch (localStorage.getItem("output_type")) {
      case "semantic":
        $("input[name=output_type][value='semantic']").prop("checked", true);
        break;
      case "syntactic":
        $("input[name=output_type][value='syntactic']").prop("checked", true);
        break;
      case "tokens":
        $("input[name=output_type][value='tokens']").prop("checked", true);
        break;
      default:
        $("input[name=output_type][value='raw']").prop("checked", true);
    }

    $.getJSON("./scalafix-compat/build_info.json", (data) => {
      document.getElementById(
        "scalameta_scalafix_compat",
      ).innerHTML += ` ${data.scalametaVersion}`;
    });

    $.getJSON("./latest/build_info.json", (data) => {
      document.getElementById(
        "scalameta_latest",
      ).innerHTML += ` ${data.scalametaVersion}`;

      const githubUrl = `https://github.com/xuwei-k/scalameta-ast/tree/${data.gitHash}`;
      const link = document.createElement("a");
      link.append(githubUrl);
      link.href = githubUrl;
      link.target = "_blank";
      document.getElementById("footer").appendChild(link);
    });

    run();
  });
});
