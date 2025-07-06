<%@ Page Language="vb" AutoEventWireup="false" CodeBehind="default.aspx.vb" Inherits="LiveWebScoreBoard._default" %>

    <!DOCTYPE html>

    <html xmlns="http://www.w3.org/1999/xhtml">

    <head runat="server">
        <!-- Required meta tags -->
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Live Web Scorebook Home Page</title>
        <link rel="stylesheet" href="Content/bootstrap.min.css" />
        <!-- Bootstrap Bundle with Popper -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        <!-- Bootstrap Icons -->
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
        <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        <style>
            body {
                background-color: #f8f9fa;
                font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, 'Liberation Sans', sans-serif;

            }

            .mobile-table-view {
                display: none;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 1.07rem;
                max-width: 1040px;
                margin: 0 auto 1.5rem auto;
                padding: 0;
            }

            .mobile-table-view .mobile-tournament-card {
                background: #fff;
                border: 3px solid #15274D;
                border-radius: 18px;
                margin-bottom: 1.2rem;
                box-shadow: 0 1px 6px 0 rgba(21, 39, 77, 0.07);
                overflow: hidden;
                transition: box-shadow 0.18s;
                display: flex;
                flex-direction: column;
            }

            .mobile-table-view .mobile-tournament-card.selected,
            .mobile-table-view .mobile-tournament-card:active {
                background-color: #dfcbb1 !important;
            }

            .mobile-table-view .mobile-tournament-row {
                display: flex;
                flex-direction: row;
                padding: 0.1em 1.1em;
                align-items: center;
            }

            .mobile-table-view .mobile-tournament-row:last-child {
                border-bottom: none;
            }

            .mobile-table-view .mobile-tournament-header {
                display: flex;
                align-items: center;
                padding: 0.65em 1.1em 0.3em 1.1em;
            }

            .mobile-table-view .mobile-tournament-date {
                color: #15274D;
                font-weight: 800;
                font-size: 1.1rem;
                margin-right: 1em;
            }

            .mobile-table-view .mobile-tournament-title {
                color: #15274D;
                font-weight: 600;
                font-size: 1.1rem;
                flex: 1;
            }

            .mobile-table-view .mobile-tournament-label {
                color: #1a355e;
                font-weight: 600;
                min-width: 90px;
                margin-right: 0.7em;
                flex-shrink: 0;
                font-size: 0.85rem;
            }

            .mobile-table-view .mobile-tournament-value {
                color: #15274D;
                font-weight: 500;
                flex: 1 1 auto;
                text-align: left;
                word-break: break-word;
            }

            .mobile-table-view .small-text {
                font-size: 0.85rem;
                color: #666;
                padding: 0 1.1em;
            }

            .filter-btn {
                /* Clean, modern button styling */
                border-radius: 999px;
                padding: 0.3rem 0.7rem;
                font-size: 0.75rem;
                border: 1.5px solid #15274D;
                color: #15274D;
                background: #f8f9fa;
                transition: all 0.2s ease;
                margin: 0.1rem;
                white-space: nowrap;
            }

            .filter-btn.btn-primary,
            .filter-btn.active {
                background: #15274D;
                color: #f8f9fa;
                border-color: #15274D;
            }

            .filter-btn:focus {
                outline: 2px solid #15274D;
                outline-offset: 2px;
            }

            .filter-container {
                border: 2px solid #15274D;
                border-radius: 1rem;
                margin: 0.75rem 0 0 0;
                padding: 0.5rem;
                display: flex;
                flex-wrap: wrap;
                width: 100%;
            }

            .filter-section {
                flex: 1 1 auto;
                min-width: 0;
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
                align-items: center;
                min-height: 70px;
                /* Enforce minimum height for 2 rows */
            }

            /* Force buttons to wrap into at least 2 rows */
            .filter-section .filter-btn {
                max-width: 32%;
                /* Limit width to force wrapping */
                margin-bottom: 0.35rem;
            }

            /* Filter containers layout */
            .filter-containers-wrapper {
                margin-top: .7rem;
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                width: 100%;
            }

            .filter-containers-wrapper .filter-container {
                flex: 1 1 calc(50% - 0.5rem);
                min-width: 280px;
            }

            .filter-container {
                max-width: 30%;
            }

            /* Make the second container (region filter) narrower */
            .filter-containers-wrapper .filter-container:nth-child(2) {
                max-width: 300px;
            }

            /* Specific adjustments for region buttons */
            .filter-containers-wrapper .filter-container:nth-child(2) .filter-btn {
                max-width: 28%;
                min-width: 60px;
            }

            .navbar-balance {
                visibility: hidden;
            }

            .navbar-balance img {
                height: 38px;
                width: auto;
                visibility: hidden;
            }

            .no-results-message {
                display: none;
                font-size: 1.2rem;
                color: #15274D;
                font-weight: 600;
                margin: 2rem 0;
            }

            /* Desktop tournament container */
            .desktop-tournament-container {
                display: flex;
                flex-direction: row;
                gap: 2.5rem;
                align-items: flex-start;
            }

            /* Tournament info panel styling */
            .tournament-info-panel {
                border-radius: 12px;
                margin-top: 1rem;
                display: block !important;
                margin-left: 0;
            }

            .tournament-info-content {
                padding: 1.5rem;
            }

            /* Mobile tournament detail panel */
            .mobile-tournament-detail {
                margin: 1rem 0;
                animation: slideDown 0.3s ease-out;
            }

            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .custom-navbar {
                background-color: #15274D;
                flex-wrap: nowrap;
            }

            .custom-navbar .navbar-grid {
                display: grid;
                grid-template-columns: auto minmax(18rem, 40rem) auto;
                width: 100%;
                align-items: center;
            }

            .navbar-brand {
                min-width: 60px;
                max-width: 200px;
                overflow: visible;
                white-space: normal;
                grid-column: auto;
                display: flex;
                align-items: center;
                height: 100%;
            }

            .navbar-search-wrap,
            .navbar-resources-wrap {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                grid-column: auto;
                display: flex;
                align-items: center;
                height: 100%;
            }

            .navbar-brand {
                flex: 0 1 auto;
            }

            .navbar-search-wrap {
                width: 100%;
                min-width: 18rem;
                max-width: 40rem;
                gap: 0.5rem;
                padding-left: 12px;
                padding-right: 12px;
                margin: 0 auto;
            }

            .navbar-resources-wrap {
                justify-self: end;
            }

            .search-input {
                min-width: 0;
                max-width: 1000px;
                width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                margin-left: 0.25rem;
                margin-right: 0.25rem;
                padding-left: 0.75rem;
                padding-right: 0.75rem;
            }

            .resources-text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                display: inline-block;
                min-width: 0;
                flex-shrink: 1;
                flex-basis: auto;
                vertical-align: middle;
            }

            .tournament-section-header {
                margin-left: 0 !important;
                margin-right: 0 !important;
                width: 100%;
            }

            .navbar-brand img {
                margin-right: 10px;
            }

            #TList table {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 1.07rem;
                margin: auto;
                max-width: 1040px;
                border-collapse: separate;
                border-spacing: 0;
            }

            #TList th,
            #TList td {
                padding: 0.65em 1.1em;
                text-align: left;
                border-top: 3px solid #15274D;
                border-right: 3px solid #15274D;
                border-bottom: none;
                border-left: none;
                box-sizing: border-box;
            }

            /* Add left border only to first cell in each row */
            #TList td:first-child,
            #TList th:first-child {
                border-left: 3px solid #15274D;
            }

            /* Add bottom border only to cells in the last row */
            #TList tr.table-last-visible td {
                border-bottom: 3px solid #15274D;
            }

            #TList tr.table-last-visible td:first-child {
                border-bottom-left-radius: 18px;
            }

            #TList tr.table-last-visible td:last-child {
                border-bottom-right-radius: 18px;
            }

            #TList table tbody tr.selected {
                background-color: #dfcbb1 !important;
            }

            #TList table tbody tr:hover {
                background-color: #ffebc0 !important;
                cursor: pointer;
            }

            .navbar-brand {
                font-weight: 700;
                font-size: 1.4rem;
                letter-spacing: 1px;
            }

            .custom-navbar {
                padding-left: 8px;
                padding-right: 8px;
            }

            th {
                color: #1a355e;
                font-weight: 600;
            }

            #TList th:first-child {
                border-top-left-radius: 18px;
            }

            #TList th:last-child {
                border-top-right-radius: 18px;
            }

            tr {
                transition: background 0.2s;
            }

            tr.selected,
            tr.selected:hover {
                background: #dfcbb1;
            }

            a {
                color: #1a7fc1;
                text-decoration: underline;
                font-weight: 500;
            }

            a:hover {
                color: #0e5a8a;
            }



            /* Make the Name column wider */
            th.name-col,
            td.name-col {
                width: 30%;
                max-width: 420px;
            }

            th.date-col,
            td.date-col {
                width: 10%;
            }

            td.date-col {
                font-weight: 800;
            }

            th.loc-col,
            td.loc-col {
                font-size: .93rem;
                width: 26%;
            }

            th.sanction-col,
            td.sanction-col {
                width: 12%;
            }

            th.flag-col,
            td.flag-col {
                width: 12%;
            }

            .search-btn-svg {
                background-color: transparent;
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="9" cy="9" r="7" stroke="white" stroke-width="2" fill="none"/><line x1="17" y1="17" x2="13.5" y2="13.5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>');
                background-repeat: no-repeat;
                background-position: center center;
                background-size: 1.1em 1.1em;
                color: transparent !important;
                text-indent: -9999px;
                width: 2.25em;
                min-width: 2.25em;
                height: 2.25em;
                padding: 0;
                border-radius: 50%;
                border: 3px solid #f8f9fa;
                display: inline-block;
                vertical-align: middle;
                transition: background-image 0.13s, background-color 0.13s, border-color 0.13s;
                margin-left: 6px;
            }

            .search-btn-svg:hover,
            .search-btn-svg:focus {
                background-color: #f8f9fa;
                background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><circle cx="9" cy="9" r="7" stroke="%2315274D" stroke-width="2" fill="none"/><line x1="17" y1="17" x2="13.5" y2="13.5" stroke="%2315274D" stroke-width="1.5" stroke-linecap="round"/></svg>');
                background-repeat: no-repeat;
                background-position: center center;
                background-size: 1.1em 1.1em;
                border-color: #f8f9fa;
            }

            .search-btn-svg:focus {
                outline: 2px solid #15274D;
                outline-offset: 2px;
            }

            .form-control.search-input {
                width: 28rem;
                min-width: 5rem;
                height: 2.25em;
                font-size: 1rem;
                font-weight: 500;
                border-radius: 0.5rem;
                border: 1.5px solid #253558;
                background: #f8f9fa;
                color: #253558;
                box-shadow: none;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            /* Fixed dropdown menu */
            .dropdown-menu.dropdown-menu-end {
                position: fixed;
                top: 64px;
                right: 0;
                left: auto !important;
                border-radius: 0 0 0 0.75rem;
                transform: none !important;
                margin-top: 0;
                border: none;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow-y: auto;
            }

            #tournamentInfoPanel {
                display: block !important;
            }

            /* Responsive navbar adjustments */
            @media (max-width: 1200px) {

                /* First step: reduce search width */
                .search-input {
                    max-width: 320px !important;
                    width: 100% !important;
                }
            }

            @media (max-width: 992px) {

                /* Further reduce search width */
                .search-input {
                    max-width: 260px !important;
                    width: 100% !important;
                }

                .filter-container {
                    max-width: none;
                }
            }

            @media (max-width: 768px) {
                .tournament-list-container {
                    display: flex;
                    flex-direction: row !important;
                    flex-wrap: wrap;
                    align-items: flex-start;
                }

                .desktop-table-view {
                    flex: 0 0 60%;
                }

                .tournament-info-panel {
                    flex: 0 0 35%;
                    margin-left: 5%;
                    position: sticky;
                    top: 20px;
                }

                .min-width-md {
                    display: block !important;
                }

                .max-width-sm {
                    display: none !important;
                }

                /* Hide resource text, keep hamburger icon */
                .resources-text {
                    display: none;
                }

                /* Make search even smaller */
                .search-input {
                    max-width: 200px !important;
                    width: 100% !important;
                }

                /* Keep dropdown menu behavior consistent */
                .dropdown-menu.dropdown-menu-end {
                    position: absolute;
                    right: 0;
                    width: 280px;
                    max-width: 90vw;
                }
                .tournament-info-panel {
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    border-radius: 18px;
    box-shadow: 0 1px 6px 0 rgba(21, 39, 77, 0.07);
    border-width: 3px;
    position: static !important;
    z-index: auto !important;
    outline: none !important;
    flex: none !important;
}
#tournamentInfoPanel {
    display: none !important;
}

            }

            @media (max-width: 576px) {

                /* Smallest size, minimal search width */
                .search-input {
                    max-width: 140px !important;
                    width: 100% !important;
                }
            }

            /* Mobile filter section */
            @media (max-width: 700px) {
                .filter-containers-wrapper {
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: center;
                }

                .filter-containers-wrapper .filter-container {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                }

                .filter-section {
                    flex-direction: row;
                    justify-content: center;
                    overflow-x: auto;
                    padding-bottom: 0.25rem;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: thin;
                    text-align: center;
                }

                .btn-sm {
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                    margin: 0.1rem;
                }

                /* Table view toggling */
                .desktop-table-view {
                    display: block;
                }

                .mobile-table-view {
                    display: none;
                }

                /* Mobile tournament card styles */
                .tournament-card {
                    border: 1px solid #ddd;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    margin-bottom: 0.75rem;
                    background-color: #fff;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .tournament-card-header {
                    margin-bottom: 0.5rem;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 0.5rem;
                }

                .tournament-card-title {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0 0 0.25rem 0;
                    color: #15274D;
                }

                .tournament-card-date {
                    font-weight: bold;
                    color: #0d6efd;
                    font-size: 0.9rem;
                }

                .tournament-card-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.3rem;
                }

                .tournament-card-location,
                .tournament-card-sanction {
                    font-size: 0.85rem;
                    display: flex;
                    align-items: baseline;
                }

                .tournament-card-label {
                    font-weight: 600;
                    display: inline-block;
                    width: 70px;
                    flex-shrink: 0;
                }

                .tournament-card-value {
                    flex-grow: 1;
                }

                /* Mobile table hide/show behavior */
                    .desktop-table-view {
                        display: none !important;
                    }

                    .mobile-table-view {
                        display: block !important;
                        width: 100%;
                        min-height: 10px;
                    }

                /* Mobile tournament info panel */
                .tournament-info-panel {
                    margin: 0.5rem 0;
                    font-size: 0.9rem;
                }
                /* Mobile error messages */
                .text-warning {
                    font-size: 0.9rem;
                    text-align: center;
                    margin: 0.5rem 0;
                }
            }

            /* Small mobile adjustments */
            @media (max-width: 480px) {
                .custom-navbar {
                    padding: 0.25rem 0.5rem;
                }

                .navbar-brand img {
                    height: 32px;
                }

                .btn {
                    font-size: 0.875rem;
                }

                .dropdown-menu {
                    font-size: 0.875rem;
                }

                .form-control.search-input {
                    font-size: 0.9rem;
                    height: 2rem;
                }

                .search-btn-svg {
                    width: 2rem;
                    height: 2rem;
                }

                tr {
                    padding: 0.4rem;
                    margin-bottom: 0.8rem;
                }

                td.date-col,
                td.name-col {
                    font-size: 0.85rem;
                }

                td:not(.date-col):not(.name-col) {
                    font-size: 0.8rem;
                }
            }
        </style>
        <script>
            // Debug: Log panel and parent computed styles
            function debugTournamentPanelVisibility() {
                var panels = document.querySelectorAll('.tournament-info-panel');
                panels.forEach(function (panel, idx) {
                    var rect = panel.getBoundingClientRect();
                    var style = window.getComputedStyle(panel);
                    console.log('[DEBUG] Panel #' + idx, {
                        display: style.display,
                        visibility: style.visibility,
                        opacity: style.opacity,
                        zIndex: style.zIndex,
                        minHeight: style.minHeight,
                        rect: rect,
                        parent: panel.parentElement ? window.getComputedStyle(panel.parentElement) : null
                    });
                    if (panel.parentElement) {
                        var parentStyle = window.getComputedStyle(panel.parentElement);
                        var parentRect = panel.parentElement.getBoundingClientRect();
                        console.log('[DEBUG] Panel parent', {
                            display: parentStyle.display,
                            overflow: parentStyle.overflow,
                            height: parentStyle.height,
                            rect: parentRect
                        });
                    }
                });
            }
            document.addEventListener('DOMContentLoaded', debugTournamentPanelVisibility);
            setTimeout(debugTournamentPanelVisibility, 1000);
        </script>
    </head>

    <body>
        <form id="form1" runat="server">
            <!-- Blue Navbar -->
            <nav class="navbar navbar-expand-lg custom-navbar">
                <div class="container-fluid navbar-grid" style="width:100%;">
                    <!-- Make logo clickable for page refresh -->
                    <div class="navbar-brand">
                        <a href="javascript:void(0)" onclick="window.location.href=window.location.href"
                            class="align-items-center" style="padding-left: 0; cursor:pointer;" title="Refresh page">
                            <img src="images/skigirl.svg" alt="LiveWeb Ski Girl Logo"
                                style="height:38px; width:auto; display:inline-block; vertical-align:middle;" />
                        </a>
                    </div>
                    <!-- Search controls in the center -->
                    <div class="navbar-search-wrap">
                        <asp:Label ID="lbl_Errors" runat="server" CssClass="text-warning fw-bold mb-0 mx-2"></asp:Label>
                        <div style="display: inline-flex; align-items: center; width: 100%;">
                            <asp:TextBox ID="TB_SanctionID" runat="server" CssClass="form-control search-input"
                                placeholder="Sanction #, Name, or Location" style="transition: all 0.2s ease;" />
                            <asp:Button ID="Btn_SanctionID" runat="server"
                                CssClass="btn btn-light search-btn-svg flex-shrink-0" Text="" ToolTip="Search"
                                aria-label="Search" OnServerClick="Btn_SanctionID_ServerClick" />
                        </div>
                    </div>
                    <!-- Right-aligned Resources Button -->
                    <div class="navbar-resources-wrap">
                        <div class="dropdown d-flex align-items-center h-100">
                            <button class="btn d-flex align-items-center h-100 px-3" type="button"
                                id="dropdownResources" data-bs-toggle="dropdown" aria-expanded="false"
                                style="background: transparent; color: #f8f9fa; font-weight: bold; border: none; box-shadow: none; font-size: 1.05rem; transition: all 0.2s;"
                                onmouseover="this.style.backgroundColor='#253558'"
                                onmouseout="this.style.backgroundColor='transparent'">
                                <span class="resources-text">WSTIMS Resources</span><span class="ms-2"
                                    style="padding-right: 8px;">&#9776;</span>
                            </button>

                            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownResources"
                                style="min-width: 300px; background-color: #15274D; margin: 0; padding: 0; width: auto; max-width: 90vw;">
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="/AppRepo/WaterskiScoringSystem/publish.htm" target="_blank"
                                        style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-download me-2"></i>WSTIMS For Windows Download
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="/AppRepo/WscMessageHandler/publish.htm" target="_blank"
                                        style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-chat-dots me-2"></i>WaterSkiConnect Message Handler
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="/AppRepo/waterski.sdf" download="waterski.sdf"
                                        style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-hdd-rack me-2"></i>WSTIMS Database Download
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="https://teamusa-org-migration.s3.amazonaws.com/USA%20Water%20Ski%20&amp;%20Wake%20Sports/Migration/Documents/AWSAScoringTutorial.pdf"
                                        target="_blank" style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-file-earmark-text me-2"></i>Scoring Tutorial
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'" href="/Newsletters/"
                                        target="_blank" style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-archive me-2"></i>Newsletter Archive
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="/Newsletters/Volume23/How To Do It 2-24-23.pdf" target="_blank"
                                        style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-journal-text me-2"></i>How to Index
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'" href="/ReleaseDocuments/"
                                        target="_blank" style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-folder2-open me-2"></i>Release Documents
                                    </a></li>
                                <li><a class="dropdown-item d-flex align-items-center text-white"
                                        style="transition: background-color 0.2s;"
                                        onmouseover="this.style.backgroundColor='#253558'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                        href="https://waterskiresults.vids.io/" target="_blank"
                                        style="padding: 0.5rem 1.5rem;">
                                        <i class="bi bi-camera-video me-2"></i>Trick Video Site
                                    </a></li>
                            </ul>
                        </div>
                    </div>
            </nav>
            <!-- Filter Bubbles Section -->
            <div class="mx-auto ms-4 px-3 align-items-start">
                <div class="filter-containers-wrapper">
                    <!-- Year Filter Container -->
                    <div class="filter-container">
                        <div class="filter-section">
                            <asp:Button ID="Btn_Recent20" runat="server" Text="Most Recent 20"
                                CssClass="filter-btn btn-primary" OnClick="Btn_Filter_Click" CommandArgument="0" />
                            <asp:Button ID="Btn_Year2025" runat="server" Text="Ski Year 2025" CssClass="filter-btn"
                                OnClick="Btn_Filter_Click" CommandArgument="25" />
                            <asp:Button ID="Btn_Year2024" runat="server" Text="Ski Year 2024" CssClass="filter-btn"
                                OnClick="Btn_Filter_Click" CommandArgument="24" />
                            <asp:Button ID="Btn_Year2023" runat="server" Text="Ski Year 2023" CssClass="filter-btn"
                                OnClick="Btn_Filter_Click" CommandArgument="23" />
                            <asp:Button ID="Btn_Year2022" runat="server" Text="Ski Year 2022" CssClass="filter-btn"
                                OnClick="Btn_Filter_Click" CommandArgument="22" />
                            <asp:Button ID="Btn_Year2021" runat="server" Text="Ski Year 2021" CssClass="filter-btn"
                                OnClick="Btn_Filter_Click" CommandArgument="21" />
                        </div>
                    </div>

                    <!-- Region Filter Container -->
                    <div class="filter-container">
                        <div class="filter-section">
                            <asp:Button ID="Btn_RegionEast" runat="server" Text="East" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="E" />
                            <asp:Button ID="Btn_RegionSouth" runat="server" Text="South" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="S" />
                            <asp:Button ID="Btn_RegionMidwest" runat="server" Text="Midwest" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="M" />
                            <asp:Button ID="Btn_RegionCentral" runat="server" Text="Central" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="C" />
                            <asp:Button ID="Btn_RegionWest" runat="server" Text="West" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="W" />
                            <asp:Button ID="Btn_RegionNone" runat="server" Text="None" CssClass="filter-btn"
                                OnClick="Btn_RegionFilter_Click" CommandArgument="" />
                        </div>
                    </div>
                </div>
                <div class="d-flex flex-column justify-content-start mb-5 mt-3 tournament-list-container">
                    <asp:Label ID="Lbl_TournamentErrors" runat="server" ForeColor="Red" Font-Bold="true"
                        CssClass="mb-2"></asp:Label>

                    <!-- Desktop: Wrap table and details panel together -->
                    <div class="desktop-tournament-container" style="display: flex; flex-direction: row; gap: 20px;">
                        <!-- Original table for desktop view -->
                        <div id="TList" runat="server" class="mb-4 desktop-table-view align-self-start"
                            style="flex: 1 1 0%; min-width: 0;"></div>

                        <!-- Tournament details panel for desktop -->
                        <div id="tournamentInfoPanel" class="tournament-info-panel" style="flex-basis: 400px;">
                            <div id="tournamentInfoContent" class="tournament-info-content"></div>
                        </div>
                    </div>

                    <!-- Mobile-optimized table view -->
                    <div id="MobileTList" class="mobile-table-view mb-4"></div>

                    <div id="noResultsMessage" class="no-results-message">
                        No results found.
                    </div>
                </div>
            </div>
            <script>
                console.log('TList parsing script loaded');

                document.addEventListener('DOMContentLoaded', function () {
                    var tlistDiv = document.getElementById('TList');
                    if (!tlistDiv) { console.log('No #TList div found'); return; }
                    var tables = tlistDiv.querySelectorAll('table');
                    console.log('Tables found in #TList:', tables.length);
                    for (var i = 0; i < tables.length; i++) {
                        console.log(tables[i]);
                    }
                    if (!tables.length) { console.log('No tables found in #TList'); return; }
                    var table = tables[0];

                    // Initialize mobile view container
                    var mobileTListDiv = document.getElementById('MobileTList');
                    if (!mobileTListDiv) {
                        console.log('No mobile tournament list container found');
                    }

                    // Add table header if not present
                    var thead = table.querySelector('thead');
                    if (!thead) {
                        thead = document.createElement('thead');
                        var headerRow = document.createElement('tr');
                        headerRow.innerHTML = `
                        <th class="date-col">Date</th>
                        <th class="name-col">Name</th>
                        <th class="loc-col">Location</th>
                        <th class="sanction-col">Sanction #</th>
                    `;
                        thead.appendChild(headerRow);
                        table.insertBefore(thead, table.firstChild);
                    }

                    // For each row, split the lumped cell into columns
                    var rows = table.querySelectorAll('tbody tr, tr');
                    console.log('Rows found in table:', rows.length);

                    // Generate mobile tournament cards
                    if (mobileTListDiv) {
                        mobileTListDiv.innerHTML = ''; // Clear existing content
                    }
                    var cardsCreated = 0;
                    rows.forEach(function (row) {
                        var tds = row.querySelectorAll('td');
                        if (tds.length === 2) {
                            // Preserve flag/icon from first column
                            var flagHtml = tds[0].innerHTML.trim();
                            var cell = tds[1];
                            var bolds = cell.querySelectorAll('b');
                            var nameHtml = '', name = '', date = '', sanction = '', loc = '';
                            // Name is first <a><b>
                            var a = cell.querySelector('a');
                            if (a) {
                                nameHtml = a.outerHTML;
                                name = a.textContent.trim();
                            }
                            // Date/Sanction is second <b>
                            if (bolds.length >= 2) {
                                var dsText = bolds[1].textContent.trim();
                                var parts = dsText.split(/\s+/);
                                if (parts.length >= 2) {
                                    date = parts[0];
                                    sanction = parts[1];
                                }
                            }
                            // Location: next non-empty text node after second <b>
                            var foundLoc = false;
                            for (let i = 0; i < cell.childNodes.length; i++) {
                                var node = cell.childNodes[i];
                                if (node === bolds[1]) {
                                    foundLoc = true;
                                    continue;
                                }
                                if (foundLoc && node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                                    loc = node.textContent.replace(/^\s*["']?\s*/, '').replace(/["']?\s*$/, '').trim();
                                    break;
                                }
                            }

                            // Create mobile card
                            if (mobileTListDiv) {
                                const card = document.createElement('div');
                                card.className = 'card mobile-tournament-card';
                                card.style.marginBottom = '10px';
                                // Add sanction ID as data attribute for selection tracking
                                card.setAttribute('data-sanction-id', sanction);

                                var hasVideo = flagHtml && flagHtml.includes('<img');
                                var videoIndicator = hasVideo ? flagHtml : '';

                                card.innerHTML = `
                                    <div class="mobile-tournament-header">
                                        <span class="mobile-tournament-date">${date || 'N/A'}</span>
                                        <span class="mobile-tournament-title">${nameHtml || 'N/A'}</span>
                                        ${videoIndicator ? videoIndicator : ''}
                                    </div>
                                    <div class="mobile-tournament-row">
                                        <span class="mobile-tournament-value small-text">${loc || 'N/A'}</span>
                                    </div>
                                    <div class="mobile-tournament-row">
                                        <span class="mobile-tournament-value small-text">${sanction || 'N/A'}</span>
                                    </div>
                                `;

                                // Copy any data attributes and event handlers from original row
                                if (row.hasAttribute('data-trick-video')) {
                                    card.setAttribute('data-trick-video', row.getAttribute('data-trick-video'));
                                }

                                // Add click handler
                                card.addEventListener('click', function (e) {
                                    if (window.external && typeof window.external.LogMessage === 'function') {
                                        try { window.external.LogMessage('[LWS] mobile card click for sanction=' + (sanction || 'unknown')); } catch (e) { }
                                    } else { console.log('[VSLOG] mobile card click for sanction=' + (sanction || 'unknown')); }
                                    e.preventDefault(); // Prevent default navigation

                                    // Highlight selected card
                                    document.querySelectorAll('.mobile-tournament-card').forEach(c => {
                                        c.classList.remove('selected');
                                    });
                                    this.classList.add('selected');

                                    // Remove any existing mobile detail panels (for mobile)
                                    if (window.innerWidth < 768) {
                                        document.querySelectorAll('.mobile-tournament-detail').forEach(panel => {
                                            panel.remove();
                                        });
                                        // Insert a placeholder panel after the clicked card
                                        const mobileDetailPanel = document.createElement('div');
                                        mobileDetailPanel.className = 'mobile-tournament-detail tournament-info-panel';
                                        mobileDetailPanel.innerHTML = `<div class="tournament-info-content">Loading tournament information...</div>`;
                                        const mobileTListDiv = document.getElementById('MobileTList');
                                        if (mobileTListDiv) {
                                            mobileTListDiv.insertBefore(mobileDetailPanel, this.nextSibling);
                                        } else {
                                            // Fallback: insert after this card's parent if #MobileTList is not found
                                            this.parentNode.insertBefore(mobileDetailPanel, this.nextSibling);
                                        }
                                        setTimeout(() => {
                                            mobileDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                        }, 100);
                                    }

                                    // Call loadTournamentInfo for both desktop and mobile
                                    // Use the extracted sanction ID and trick video text
                                    let sanctionId = sanction;
                                    let trickVideoText = hasVideo ? 'Available' : 'Not Available';
                                    if (!sanctionId && a && a.textContent) {
                                        sanctionId = a.textContent.trim();
                                    }
                                    loadTournamentInfo(sanctionId, trickVideoText);

                                    // For desktop, highlight the corresponding table row
                                    if (window.innerWidth >= 768 && row) {
                                        const allRows = document.querySelectorAll('#TList table tr');
                                        allRows.forEach(r => r.classList.remove('selected'));
                                        row.classList.add('selected');
                                    }
                                });

                                mobileTListDiv.appendChild(card);
                                cardsCreated++;
                            }
                            // Show fallback if no cards were created
                            if (mobileTListDiv && cardsCreated === 0) {
                                mobileTListDiv.innerHTML = '<div class="text-warning">No tournaments found.</div>';
                            }

                            var sanctionId = sanction || '';

                            // Store trick video status in a data attribute
                            var trickVideoText = (flagHtml && flagHtml.includes('<img')) ? 'Available' : 'Not Available';
                            row.setAttribute('data-trick-video', trickVideoText);

                            // Add data attributes for filtering
                            // Extract ski year from tournament date
                            let year = '';
                            if (date) {
                                // Parse the date correctly to determine ski year
                                try {
                                    const dateParts = date.split('/');
                                    if (dateParts.length === 3) {
                                        const month = parseInt(dateParts[0], 10);
                                        const day = parseInt(dateParts[1], 10);
                                        const calendarYear = parseInt(dateParts[2], 10);

                                        // After July, it's the next ski year (per VB.NET logic)
                                        const skiYear = month > 7 ? calendarYear + 1 : calendarYear;
                                        year = skiYear.toString();
                                        console.log('Date: ' + date + ', Calendar Year: ' + calendarYear + ', Ski Year: ' + skiYear);
                                    } else {
                                        // Fallback to regular expression matching if date format is unexpected
                                        const dateMatch = date.match(/(20\d\d)/);
                                        if (dateMatch && dateMatch[1]) {
                                            year = dateMatch[1];
                                        }
                                    }
                                } catch (e) {
                                    console.error('Error parsing date for ski year:', e);
                                    // Fallback to regular expression matching
                                    const dateMatch = date.match(/(20\d\d)/);
                                    if (dateMatch && dateMatch[1]) {
                                        year = dateMatch[1];
                                    }
                                }
                            }
                            row.setAttribute('data-year', year);

                            // Determine if tournament is upcoming or completed
                            const tournamentDate = date ? new Date(date) : null;
                            const today = new Date();
                            const status = tournamentDate && tournamentDate > today ? 'upcoming' : 'completed';
                            row.setAttribute('data-status', status);

                            // Check if it's a pro event (simple check for 'pro' in the name)
                            const isPro = nameHtml.toLowerCase().includes('pro');
                            row.setAttribute('data-pro', isPro);
                            row.innerHTML = `
                                <td class="date-col">${date}</td>
                                <td class="name-col">${nameHtml}</td>
                                <td class="loc-col">${loc}</td>
                                <td class="sanction-col">${sanction}</td>
                            `;

                            // Attach click handler for row selection and info loading
                            row.addEventListener('click', function () {
                                // Remove selected class from all rows
                                document.querySelectorAll('#TList tr').forEach(function (r) {
                                    r.classList.remove('selected');
                                });
                                // Add selected class to clicked row
                                this.classList.add('selected');
                                // Auto-scroll to top
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                // Find the sanction ID in the row and load tournament info
                                var sanctionCell = this.querySelector('.sanction-col');
                                var trickVideoText = this.getAttribute('data-trick-video');
                                if (sanctionCell) {
                                    var sanctionId = sanctionCell.textContent.trim();
                                    loadTournamentInfo(sanctionId, trickVideoText);
                                }
                            });

                            // Debug log for confirmation
                        }
                    });

                    // Ensure only the last visible row has the table-last-visible class
                    var tbodyRows = table.querySelectorAll('tbody tr');
                    if (tbodyRows.length > 0) {
                        tbodyRows.forEach(function (row) { row.classList.remove('table-last-visible'); });
                        tbodyRows[tbodyRows.length - 1].classList.add('table-last-visible');
                    }

                });


                // Handle clicks on links inside rows to prevent event bubbling
                document.querySelectorAll('#TList a').forEach(function (link) {
                    link.addEventListener('click', function (e) {
                        e.stopPropagation();
                    });
                });



                // Global variable to track currently selected tournament
                var currentSelectedTournamentId = '';
                var currentTrickVideoText = '';

                // Function to handle viewport size changes
                function handleViewportChange() {
                    const vsLog = function(msg) {
                        if (window.external && typeof window.external.LogMessage === 'function') {
                            try { window.external.LogMessage('[LWS] ' + msg); } catch (e) { console.log('[VSLOG FAIL]', e, msg); }
                        } else {
                            console.log('[VSLOG]', msg);
                        }
                    };

                    // Get current viewport width and previous state
                    const currentWidth = window.innerWidth;
                    const isMobile = currentWidth < 768;
                    const wasMobile = window.lastKnownMobile;
                    
                    vsLog('ENTER handleViewportChange: width=' + currentWidth + ', isMobile=' + isMobile + 
                          ', wasMobile=' + wasMobile + ', currentSelectedTournamentId=' + currentSelectedTournamentId);
                    console.log('Viewport change:', {width: currentWidth, isMobile, wasMobile, selection: currentSelectedTournamentId});
                    
                    // Update the desktop panel visibility directly
                    const desktopPanel = document.getElementById('tournamentInfoPanel');
                    if (desktopPanel) {
                        if (isMobile) {
                            desktopPanel.style.display = 'none';
                            vsLog('Force-hiding desktop panel (inline style)');
                        } else {
                            desktopPanel.style.display = '';
                            vsLog('Restoring desktop panel visibility (removing inline style)');
                        }
                    }
                    
                    // Save current mobile state for next comparison
                    window.lastKnownMobile = isMobile;
                    
                    // If viewport changed between mobile/desktop OR this is first load with selection
                    if ((wasMobile !== isMobile || (currentSelectedTournamentId && wasMobile === undefined)) && currentSelectedTournamentId) {
                        vsLog('Viewport changed from ' + (wasMobile ? 'mobile' : 'desktop') + ' to ' + (isMobile ? 'mobile' : 'desktop'));
                        vsLog('Working with selected tournament: ' + currentSelectedTournamentId);
                            
                            // Ensure correct tournament info panel visibility based on viewport
                            const desktopPanel = document.getElementById('tournamentInfoPanel');
                            if (desktopPanel) {
                                // Always use CSS for control, we're not changing inline styles
                                // The visibility is controlled by the media query CSS
                                vsLog('Desktop panel visibility updated via CSS');
                            }
                            
                            // If we have a selected tournament, reload its info in the appropriate panel
                            if (currentSelectedTournamentId) {
                                vsLog('Reloading tournament info for ' + currentSelectedTournamentId);
                                setTimeout(() => {
                                    loadTournamentInfo(currentSelectedTournamentId, currentTrickVideoText);
                                    
                                    // Highlight the appropriate row/card in the new view
                                    if (isMobile) {
                                        // Mobile: highlight the correct card and insert mobile panel
                                        let selectedCard = null;
                                        const mobileCards = document.querySelectorAll('.mobile-tournament-card');
                                        
                                        // First find and select the correct card
                                        mobileCards.forEach(card => {
                                            card.classList.remove('selected');
                                            const cardSanctionId = card.getAttribute('data-sanction-id');
                                            if (cardSanctionId === currentSelectedTournamentId) {
                                                card.classList.add('selected');
                                                selectedCard = card;
                                                vsLog('Mobile card selected: ' + cardSanctionId);
                                            }
                                        });
                                        
                                        // Remove any existing mobile detail panels
                                        document.querySelectorAll('.mobile-tournament-detail').forEach(panel => {
                                            panel.remove();
                                            vsLog('Removed existing mobile detail panel');
                                        });
                                        
                                        // If we found a card to select, insert a new detail panel after it
                                        if (selectedCard) {
                                            const mobileDetailPanel = document.createElement('div');
                                            mobileDetailPanel.className = 'mobile-tournament-detail';
                                            mobileDetailPanel.innerHTML = '<div class="tournament-info-content">Loading tournament information...</div>';
                                            
                                            // Insert the panel after the selected card
                                            const mobileTListDiv = document.getElementById('MobileTList');
                                            if (mobileTListDiv && selectedCard) {
                                                mobileTListDiv.insertBefore(mobileDetailPanel, selectedCard.nextSibling);
                                                vsLog('Inserted new mobile detail panel after selected card');
                                                
                                                // Ensure it's visible and scrolled into view
                                                setTimeout(() => {
                                                    mobileDetailPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                }, 100);
                                            }
                                        }
                                    } else {
                                        // Desktop: highlight the correct table row
                                        const desktopRows = document.querySelectorAll('#TList table tr');
                                        desktopRows.forEach(row => {
                                            row.classList.remove('selected');
                                            const sanctionCell = row.querySelector('.sanction-col');
                                            if (sanctionCell && sanctionCell.textContent.trim() === currentSelectedTournamentId) {
                                                row.classList.add('selected');
                                                vsLog('Desktop row selected: ' + currentSelectedTournamentId);
                                            }
                                        });
                                    }
                                }, 200);
                            }
                        }
                    }
                
                
                
                // Add resize event listener
                window.addEventListener('resize', function() {
                    // Use debouncing to avoid excessive function calls
                    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
                    this.resizeTimeout = setTimeout(function() {
                        handleViewportChange();
                    }, 250);
                });

                // Function to load tournament officials only
                function loadTournamentInfo(sanctionId, trickVideoText) {
                    // Track the currently selected tournament
                    currentSelectedTournamentId = sanctionId;
                    currentTrickVideoText = trickVideoText || '';
                    // VS Output log helper
                    function vsLog(msg) {
                        if (window.external && typeof window.external.LogMessage === 'function') {
                            try { window.external.LogMessage('[LWS] ' + msg); } catch (e) { console.log('[VSLOG FAIL]', e, msg); }
                        } else {
                            console.log('[VSLOG]', msg);
                        }
                    }
                    vsLog('ENTER loadTournamentInfo: sanctionId=' + sanctionId + ', trickVideoText=' + trickVideoText);
                    console.log('Loading officials info for:', sanctionId);
                    console.log('Loading officials info for:', sanctionId);
                    // Determine if we're in mobile or desktop view
                    var isMobile = window.innerWidth < 768;
                    vsLog('isMobile=' + isMobile);
                    if (isMobile) {
                        // Find the first .mobile-tournament-detail after the selected card
                        var selectedCard = document.querySelector('.mobile-tournament-card.selected');
                        var mobileDetailPanel = null;
                        if (selectedCard) {
                            var sibling = selectedCard.nextSibling;
                            while (sibling) {
                                if (sibling.classList && sibling.classList.contains('mobile-tournament-detail')) {
                                    mobileDetailPanel = sibling;
                                    break;
                                }
                                sibling = sibling.nextSibling;
                            }
                        }
                        if (mobileDetailPanel) {
                            mobileDetailPanel.innerHTML = '<div class="tournament-info-content">Loading tournament information...</div>';
                        } else {
                            console.warn('Mobile detail panel not found after selected card');
                        }
                    } else {
                        // Desktop
                        $('#tournamentInfoContent').html('<p>Loading officials information...</p>');
                    }

                    // For debugging - show the container
                    vsLog('tournamentInfoContent element: ' + ($('#tournamentInfoContent').length ? 'exists' : 'does not exist'));
                    console.log('tournamentInfoContent element:', $('#tournamentInfoContent').length ? 'exists' : 'does not exist');

                    var ajaxUrl = "TDetails.aspx";
                    vsLog('Making AJAX request to: ' + ajaxUrl + ', sid=' + sanctionId);
                    console.log('Making AJAX request to:', ajaxUrl, 'with data:', { sid: sanctionId });

                    // Try using $.getJSON first to test if we can get the data
                    $.getJSON(ajaxUrl, { sid: sanctionId })
                        .done(function (response) {
                            vsLog('AJAX SUCCESS for sid=' + sanctionId);
                            console.log("GETJSON SUCCESS - Raw response:", response);
                            console.log("GETJSON SUCCESS - Raw response:", response);
                            // Detailed debugging of response structure
                            console.log("Response structure details:");
                            console.log("- Success:", response.Success);
                            console.log("- Officials array exists:", !!response.Officials, "Length:", response.Officials ? response.Officials.length : 0);
                            console.log("- RawSpecs array exists:", !!response.RawSpecs, "Length:", response.RawSpecs ? response.RawSpecs.length : 0);
                            console.log("- Teams array exists:", !!response.Teams, "Length:", response.Teams ? response.Teams.length : 0);
                            if (response.Teams && response.Teams.length > 0) {
                                console.log("- First team:", response.Teams[0]);
                            }
                            processResponse(response, trickVideoText);
                        })
                        .fail(function (xhr, status, error) {
                            vsLog('AJAX FAIL for sid=' + sanctionId + ', status=' + status + ', error=' + error);
                            console.error("GETJSON FAILED:", status, error);
                            console.log("GETJSON xhr:", xhr);
                            console.log("Response text:", xhr.responseText);
                            $('#tournamentInfoContent').html('<p class="text-danger">Error loading tournament information: ' + error + '</p>' +
                                '<p>Status: ' + status + '</p>' +
                                '<pre class="small">' + (xhr.responseText || 'No response text') + '</pre>');
                        });

                    function processResponse(response, trickVideoText) {
                        console.log('Processing response in processResponse function');
                        if (!response) {
                            console.error('Response is null or undefined');
                            $('#tournamentInfoContent').html('<div class="text-danger">Invalid response from server (null)</div>');
                            return;
                        }
                        if (typeof response !== 'object') {
                            console.error('Response is not an object type:', typeof response);
                            $('#tournamentInfoContent').html('<div class="text-danger">Invalid response format (not an object)</div>');
                            return;
                        }
                        if (!response.Success) {
                            console.error('Response.Success is falsey:', response.Success);
                            $('#tournamentInfoContent').html('<p class="text-danger">' + (response.ErrorMessage || 'Unknown error') + '</p>');
                            return;
                        }

                        // --- Tournament Details Panel ---
                        let detailsHtml = '';
                        // Combined Tournament Details and Officials Panel with collapsible sections
                        let combinedHtml = '';
                        combinedHtml += '<div class="rounded-4 mb-3" style="background-color: #dfcbb1; padding: 0; margin: 0; border: 3px solid #15274D; border-radius: 18px;">';

                        // --- Tournament Name Above Details Header ---
                        var tournamentName = '';
                        if (response.RawSpecs && Array.isArray(response.RawSpecs) && response.RawSpecs.length > 0) {
                            for (var i = 0; i < response.RawSpecs.length; i++) {
                                var row = response.RawSpecs[i];
                                if (row && row.length >= 2 && row[0] && row[0].toLowerCase().includes('name')) {
                                    tournamentName = row[1];
                                    break;
                                }
                            }
                        }
                        if (tournamentName) {
                            var tnFontSize = tournamentName.length > 25 ? '1.2rem' : '1.7rem';
                            combinedHtml += '<div style="font-size: ' + tnFontSize + '; font-weight: bold; color: #1a355e; margin: .9em 1.3em .9em 1.3em; text-align:center;">' + tournamentName + '</div>';
                        }
                        // --- Active Event(s) Display ---
                        if (response.ActiveEvent && response.ActiveEvent.trim() !== "") {
                            combinedHtml += '<div style="background: #15274D; color: #f8f9fa; border-radius: 12px; margin: 0.4em 1.5em 0.6em 1.5em; padding: 0.5em 1.2em; font-size: 1rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.7em; box-shadow: 0 2px 8px rgba(21,101,192,0.08);">' +
                                '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f8f9fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 2px;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2.5 2.5"/></svg>' +
                                response.ActiveEvent +
                                '</div>';
                        }
                        // --- Tournament Details Header ---
                        combinedHtml += '<div class="d-flex align-items-center tournament-section-header" style="cursor:pointer;gap:8px;min-height:32px; padding: .8em 1.5em .3em 1.5em;" id="tournamentDetailsToggleHeader">';
                        combinedHtml += '<h5 class="mb-0" style="color: #333; line-height:1.4; font-size:1.1rem;">Tournament Details</h5>';
                        combinedHtml += '<span id="tournamentDetailsChevron" style="display: flex; align-items: center; height: 28px; transition: transform 0.15s; margin-left: 0; margin-bottom: 4px;"><svg width="20" height="20" viewBox="0 0 20 20" style="display:block;"><polyline points="5,8 10,13 15,8" style="fill:none;stroke:#333;stroke-width:2"/></svg></span>';
                        combinedHtml += '</div>';

                        // --- Tournament Details Content ---
                        combinedHtml += '<div id="tournamentDetailsCollapse">';
                        if (response.RawSpecs && Array.isArray(response.RawSpecs) && response.RawSpecs.length > 0) {
                            combinedHtml += '<ul class="list-unstyled mb-3" style="margin-left: 22px; margin-top: 0.1em; margin-bottom: 0.3em;">';
                            for (var i = 0; i < response.RawSpecs.length; i++) {
                                var row = response.RawSpecs[i];
                                // skip the Name attribute in the list
                                if (row && row.length >= 2 && row[0] && row[0].toLowerCase().includes('name')) continue;
                                if (row && row.length >= 2 && row[0]) {
                                    // Skip sanctionID, start date, and location entries
                                    var label = row[0].toLowerCase();
                                    if (label.includes('sanction') || label.includes('id') ||
                                        label.includes('start date') || label.includes('location')) {
                                        continue;
                                    }

                                    combinedHtml += '<li>';
                                    var displayLabel = row[0];
                                    combinedHtml += '<span style="color: #333; font-weight: 600;">- ' + displayLabel + (displayLabel.trim().endsWith(':') ? ' ' : ': ') + '</span>';
                                    combinedHtml += '<span style="color: #333;">' + (row[1] || '<span class="text-muted">N/A</span>') + '</span>';
                                    combinedHtml += '</li>';
                                }
                            }
                            // Add Trick Video information as an additional item
                            combinedHtml += '<li><span style="color: #333; font-weight: 600;">- Trick Video: </span><span style="color: #333;">' + (trickVideoText || '<span class="text-muted">N/A</span>') + '</span></li>';
                            combinedHtml += '</ul>';
                        } else {
                            combinedHtml += '<div class="text-danger" style="margin-left: 25px;">No tournament details available.</div>';
                        }
                        combinedHtml += '</div>';

                        // --- Officials Header
                        combinedHtml += '<div class="d-flex align-items-center tournament-section-header" style="cursor:pointer;gap:8px;min-height:32px; padding: .8em .8em .3em .8em; border-top: 2px solid #15274D; text-align: left; margin-left: .8em;" id="officialsToggleHeader">';
                        combinedHtml += '<h5 class="mb-0" style="color: #333; line-height:1.4; font-size:1.1rem; margin: 0; text-align: left;">Tournament Officials</h5>';
                        combinedHtml += '<span id="officialsChevron" style="display: flex; align-items: center; height: 28px; transition: transform 0.15s; margin-left: 0;"><svg width="20" height="20" viewBox="0 0 20 20" style="display:block;"><polyline points="5,8 10,13 15,8" style="fill:none;stroke:#333;stroke-width:2"/></svg></span>';
                        combinedHtml += '</div>';

                        // --- Officials Content ---
                        if (response.Officials && Array.isArray(response.Officials) && response.Officials.length > 0) {
                            combinedHtml += '<ul class="list-unstyled mb-3" style="margin-left: 22px; margin-top: 0.1em; margin-bottom: 0.3em;">';
                            for (var j = 0; j < response.Officials.length; j++) {
                                var o = response.Officials[j];
                                if (o && o.Role) {
                                    combinedHtml += '<li>';
                                    combinedHtml += '<span style="color: #333; font-weight: 600;">- ' + o.Role + ': </span>';
                                    combinedHtml += '<span style="color: #333; margin-right: 10px;">' + (o.FirstName ? o.FirstName + ' ' : '') + (o.LastName || '') + '</span>';
                                    combinedHtml += '</li>';
                                }
                            }
                            combinedHtml += '</ul>';
                        } else {
                            combinedHtml += '<div class="text-danger" style="margin-left: 25px; padding-right: 15px;">No officials available.</div>';
                        }
                        combinedHtml += '</div>';

                        // --- Teams Header ---
                        console.log('Teams section - checking for team data');
                        console.log('response.Teams exists:', !!response.Teams);
                        console.log('response.Teams is array:', response.Teams ? Array.isArray(response.Teams) : false);
                        console.log('response.Teams length:', response.Teams ? response.Teams.length : 0);
                        if (response.Teams) console.log('Teams data sample:', JSON.stringify(response.Teams).substring(0, 100));

                        if (response.Teams && Array.isArray(response.Teams) && response.Teams.length > 0) {
                            combinedHtml += '<div class="d-flex align-items-center tournament-section-header" style="cursor:pointer;gap:8px;min-height:32px; padding: .8em 1.5em .3em 1.5em; border-top: 2px solid #15274D;" id="teamsToggleHeader">';
                            combinedHtml += '<h5 class="mb-0" style="color: #333; line-height:1.4; font-size:1.1rem;">Participating Teams</h5>';
                            combinedHtml += '<span id="teamsChevron" style="display: flex; align-items: center; height: 28px; transition: transform 0.15s; margin-left: 0;"><svg width="20" height="20" viewBox="0 0 20 20" style="display:block;"><polyline points="5,8 10,13 15,8" style="fill:none;stroke:#333;stroke-width:2"/></svg></span>';
                            combinedHtml += '</div>';

                            // --- Teams Content ---
                            combinedHtml += '<div id="teamsCollapse">';
                            combinedHtml += '<ul class="list-unstyled mb-4" style="margin-left: 22px; margin-top: 0.1em; margin-bottom: 0.3em;">';
                            for (var t = 0; t < response.Teams.length; t++) {
                                var team = response.Teams[t];
                                combinedHtml += '<li>';
                                combinedHtml += '<span style="color: #333; font-weight: 600;">- ' + team.Name + '</span>';
                                combinedHtml += '</li>';
                            }
                            combinedHtml += '</ul>';
                            combinedHtml += '</div>';
                        }
                        combinedHtml += '</div>';

                        // Replace detailsHtml with combinedHtml
                        var isMobile = window.innerWidth < 768;
                        vsLog('Rendering tournament details, isMobile=' + isMobile);
                        if (isMobile) {
                            // Find the first .mobile-tournament-detail after the selected card
                            var selectedCard = document.querySelector('.mobile-tournament-card.selected');
                            var mobileDetailPanel = null;
                            if (selectedCard) {
                                var sibling = selectedCard.nextSibling;
                                while (sibling) {
                                    if (sibling.classList && sibling.classList.contains('mobile-tournament-detail')) {
                                        mobileDetailPanel = sibling;
                                        break;
                                    }
                                    sibling = sibling.nextSibling;
                                }
                            }
                            if (mobileDetailPanel) {
                                vsLog('mobileDetailPanel found for render, updating innerHTML');
                                mobileDetailPanel.innerHTML = '<div class="tournament-info-content">' + combinedHtml + '</div>';
                            } else {
                                console.warn('Mobile detail panel not found after selected card (render)');
                            }
                        } else {
                            vsLog('Desktop: updating #tournamentInfoContent with details');
                            $('#tournamentInfoContent').html(combinedHtml);
                        }

                        // Collapse/Expand logic for Tournament Details (instant, with chevron rotate)
                        $('#tournamentDetailsToggleHeader').on('click', function () {
                            var $collapse = $('#tournamentDetailsCollapse');
                            var $chevron = $('#tournamentDetailsChevron');
                            if ($collapse.is(':visible')) {
                                $collapse.hide();
                                $chevron.css('transform', 'rotate(0deg)');
                            } else {
                                $collapse.show();
                                $chevron.css('transform', 'rotate(180deg)');
                            }
                        });
                        // Collapse/Expand logic for Officials (instant, with chevron rotate)
                        $('#officialsToggleHeader').on('click', function () {
                            var $collapse = $('#officialsCollapse');
                            var $chevron = $('#officialsChevron');
                            if ($collapse.is(':visible')) {
                                $collapse.hide();
                                $chevron.css('transform', 'rotate(0deg)');
                            } else {
                                $collapse.show();
                                $chevron.css('transform', 'rotate(180deg)');
                            }
                        });
                        // Collapse/Expand logic for Teams panel (if it exists)
                        if (response.Teams && Array.isArray(response.Teams) && response.Teams.length > 0) {
                            $('#teamsToggleHeader').on('click', function () {
                                var $collapse = $('#teamsCollapse');
                                var $chevron = $('#teamsChevron');
                                if ($collapse.is(':visible')) {
                                    $collapse.hide();
                                    $chevron.css('transform', 'rotate(0deg)');
                                } else {
                                    $collapse.show();
                                    $chevron.css('transform', 'rotate(180deg)');
                                }
                            });
                            // Default: team panel open and chevron rotated
                            $('#teamsCollapse').show();
                            $('#teamsChevron').css('transform', 'rotate(180deg)');
                        }

                        // Default: both open and chevrons rotated
                        $('#tournamentDetailsCollapse').show();
                        $('#tournamentDetailsChevron').css('transform', 'rotate(180deg)');
                        $('#officialsCollapse').show();
                        $('#officialsChevron').css('transform', 'rotate(180deg)');
                        return;

                        officialsHtml += '<div id="officialsCollapsible">';
                        officialsHtml += '<ul class="list-unstyled mb-0" style="margin-left: 5px;">';
                        if (response.Officials && response.Officials.length > 0) {
                            for (var i = 0; i < response.Officials.length; i++) {
                                var official = response.Officials[i];
                                officialsHtml += '<li>';
                                officialsHtml += '<span style="color: #333;">- ' + official.Role + ': </span>';
                                officialsHtml += '<span style="color: #333;">' + official.LastName + ', ' + official.FirstName + '</span>';
                                officialsHtml += '</li>';
                            }
                        } else {
                            officialsHtml += '<li>No officials information available</li>';
                        }
                        officialsHtml += '</ul>';
                        officialsHtml += '</div>'; // close #officialsCollapsible
                        officialsHtml += '</div>'; // close main officials box

                        // Combine panels: Tournament Details above Officials
                        $('#tournamentInfoContent').html(detailsHtml + officialsHtml);

                        // Collapse/expand logic
                        $('#officialsToggleHeader').off('click').on('click', function () {
                            var $collapsible = $('#officialsCollapsible');
                            var $chevron = $('#officialsChevron');
                            if ($collapsible.is(':visible')) {
                                $collapsible.slideUp(150);
                                $chevron.css('transform', 'rotate(0deg)');
                            } else {
                                $collapsible.slideDown(150);
                                $chevron.css('transform', 'rotate(180deg)');
                            }
                        });
                        // Start with officials expanded
                        $('#officialsCollapsible').show();
                        $('#officialsChevron').css('transform', 'rotate(180deg)');
                    }
                }
            </script>
            <!--
                        <div class="p-1 mr-4 bg-light rounded-3">
                            <h4>Welcome,</h4>
                            The WSTIMS scoring program enables scorers to post UNOFFICIAL results, as they happen.
                            Trick video is available if the <img src="images/Flag-green16.png" /> icon is displayed in
                            the tournament list.
                            For Official results click the Reports button on the Tournament Home Page.

                            <h4>Directions</h4>
                            <ol>
                                <li>Select a range of tournaments and pick from the list<br />or enter a sanction number
                                </li>
                                <li>On the Tournament Home Page select a Display Style<br />
                                    If the tournament is in progress the event(s) currently being scored are
                                    listed<br />
                                    <b>WARNING TO SKIERS:</b> DO NOT rely on the running orders displayed for your start
                                    times, especially if multiple lakes are in use.
                                </li>
                                <li>On the selected page, Select an Event<br />optional - select Division, Group or
                                    Round</li>
                                <li>Click on a skier's name to display recap results for all events entered.</li>
                                <li>Click the Update button to refresh the data</li>
                            </ol>
                        </div>
                        -->

            <!--
            <div class="row" style="margin-top: 500px;">
                <div class="col-md-6">
                    Live Web Scoreboard is a free volunteer created resource intended to advance the sport of
                    waterskiing.
                    <br />&copy; 2024 All rights reserved

                </div>
                <div class="col-md-6 text-md-end">
                    <br />
                    <asp:Button ID="Btn_Privacy_TermsOfUse" runat="server" Text="Privacy / Terms of Use" />
                    <asp:Panel ID="Panel_Priv_TofUse" runat="server" visible="false">
                        No Yada Yada<br />
                        <b>Privacy Policy</b><br />
                        This site does not collect or store any information from site users.
                        Information displayed is in the public domain and freely available elsewhere, albeit not quite
                        as conveniently.<br />

                        <b>Terms of Use</b><br />
                        Enjoy the content. Do not make any modifications. You may place a link to
                        scores.waterskiresults.com on your website.
                        Republication by any other means is prohibited without written consent.
                    </asp:Panel>
                </div>
            </div> -->

        </form>
    </body>

    </html>