Imports System.Web.UI.HtmlControls
Imports System.Web.UI.WebControls
Imports System.Text.RegularExpressions

Public Class _default
    Inherits System.Web.UI.Page

    Protected WithEvents Btn_SanctionID As Global.System.Web.UI.WebControls.Button

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        ' Backend test code has been removed now that we've implemented the full region filtering
        If Not IsPostBack Then
            ' Set the current year button to active when first loading
            Dim sCurYear As Int16 = CInt(Year(Now))
            Dim sCurYY As Int16 = CInt(Right(sCurYear, 2))
            Dim sCurMM As Int16 = CInt(Month(Now))

            ' After July, display sanctions from following ski year
            If sCurMM > 7 Then
                sCurYear += 1
                sCurYY += 1
            End If

            ' Check if we have a specific year requested in the query string
            Dim sSkiYr As String
            If Not Request("YR") Is Nothing Then
                sSkiYr = Trim(Request("YR"))

                ' Set the appropriate button as selected based on YR parameter
                SetActiveFilterButton(sSkiYr)
            Else
                ' Default to Most Recent 20 if no filter is specified
                sSkiYr = "0" ' Code for Most Recent 20
                Btn_Recent20.CssClass = "filter-btn btn-primary" ' Set default button as active
            End If

            ' Load the tournament list
            LoadTournamentList(sSkiYr)

            ' Display any error messages
            If Not Request("EM") Is Nothing Then
                lbl_Errors.Text = Request("EM")
            End If
        End If
    End Sub

    ' Button click handler for year filter buttons
    Protected Sub Btn_Filter_Click(sender As Object, e As EventArgs)
        Dim button As Button = DirectCast(sender, Button)
        Dim sSkiYr As String = button.CommandArgument
        ResetFilterButtons()
        button.CssClass = "filter-btn btn-primary"
        
        ' Preserve region filter if present
        Dim region As String = ""
        If Not Request("RG") Is Nothing Then
            region = Trim(Request("RG"))
        End If
        
        ' Use redirect to avoid POST resubmission (with region parameter if set)
        If region <> "" Then
            Response.Redirect("default.aspx?YR=" & sSkiYr & "&RG=" & region)
        Else
            Response.Redirect("default.aspx?YR=" & sSkiYr)
        End If
    End Sub
    
    ' Button click handler for region filter buttons
    Protected Sub Btn_RegionFilter_Click(sender As Object, e As EventArgs)
        Dim button As Button = DirectCast(sender, Button)
        Dim region As String = button.CommandArgument
        ResetRegionButtons()
        button.CssClass = "filter-btn btn-primary"
        
        ' Preserve year filter if present
        Dim sSkiYr As String = "0" ' Default to Most Recent 20
        If Not Request("YR") Is Nothing Then
            sSkiYr = Trim(Request("YR"))
        End If
        
        ' Use redirect to avoid POST resubmission (with year parameter)
        Response.Redirect("default.aspx?YR=" & sSkiYr & "&RG=" & region)
    End Sub
    
    ' Helper method to load tournament list based on filter
    Private Sub LoadTournamentList(sSkiYr As String)
        Dim sMsg As String = ""
        Dim sErrDetails As String = ""
        Dim region As String = ""
        
        ' Get region filter if present
        If Not Request("RG") Is Nothing Then
            region = Trim(Request("RG"))
            ' Set the region button as active
            SetActiveRegionButton(region)
        End If
        
        ' Get tournament list from data access layer
        '=== RESTORED DATABASE ACCESS CODE ===
        If sSkiYr = "21" Or sSkiYr = "22" Then
            ' Old tournaments use legacy data access (no region support)
            sMsg = ModDataAccess.GetTournamentList2(sSkiYr)
        Else
            ' New tournaments with region filter support
            sMsg = ModDataAccess3.GetTournamentList2(sSkiYr, region)
        End If

        If sMsg.Contains("Error") Then
            lbl_Errors.Text = sMsg
            sErrDetails = sMsg
            Exit Sub
        End If

        ' Update the HTML with the tournament list
        TList.InnerHtml = sMsg
    End Sub
    
    ' Helper method to set all year filter buttons to default style
    Private Sub ResetFilterButtons()
        Btn_Recent20.CssClass = "filter-btn"
        Btn_Year2021.CssClass = "filter-btn"
        Btn_Year2022.CssClass = "filter-btn"
        Btn_Year2023.CssClass = "filter-btn"
        Btn_Year2024.CssClass = "filter-btn"
        Btn_Year2025.CssClass = "filter-btn"
    End Sub
    
    ' Helper method to set all region filter buttons to default style
    Private Sub ResetRegionButtons()
        Btn_RegionEast.CssClass = "filter-btn"
        Btn_RegionSouth.CssClass = "filter-btn"
        Btn_RegionMidwest.CssClass = "filter-btn"
        Btn_RegionCentral.CssClass = "filter-btn"
        Btn_RegionWest.CssClass = "filter-btn"
    End Sub
    
    ' Helper method to set the active button based on ski year code
    Private Sub SetActiveFilterButton(sSkiYr As String)
        ResetFilterButtons()
        
        Select Case sSkiYr
            Case "0"
                Btn_Recent20.CssClass = "filter-btn btn-primary"
            Case "21"
                Btn_Year2021.CssClass = "filter-btn btn-primary"
            Case "22"
                Btn_Year2022.CssClass = "filter-btn btn-primary"
            Case "23"
                Btn_Year2023.CssClass = "filter-btn btn-primary"
            Case "24"
                Btn_Year2024.CssClass = "filter-btn btn-primary"
            Case "25"
                Btn_Year2025.CssClass = "filter-btn btn-primary"
        End Select
    End Sub
    
    ' Helper method to set the active region button based on region code
    Private Sub SetActiveRegionButton(region As String)
        ResetRegionButtons()
        
        Select Case UCase(region)
            Case "E"
                Btn_RegionEast.CssClass = "filter-btn btn-primary"
            Case "S"
                Btn_RegionSouth.CssClass = "filter-btn btn-primary"
            Case "M"
                Btn_RegionMidwest.CssClass = "filter-btn btn-primary"
            Case "C"
                Btn_RegionCentral.CssClass = "filter-btn btn-primary"
            Case "W"
                Btn_RegionWest.CssClass = "filter-btn btn-primary"
        End Select
    End Sub
    
    Protected Sub Btn_Home_Click(sender As Object, e As EventArgs)
        Response.Redirect("default.aspx")
    End Sub

    Protected Sub Btn_Privacy_TermsOfUse_Click(sender As Object, e As EventArgs)
        If Panel_Priv_TofUse.Visible = True Then
            Panel_Priv_TofUse.Visible = False
        Else
            Panel_Priv_TofUse.Visible = True
        End If
    End Sub

    ' Removed client-side filtering approach

    Protected Sub Btn_SanctionID_ServerClick(sender As Object, e As EventArgs)
        System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click CALLED")
        Dim sInput As String = TB_SanctionID.Text.Trim()
        Dim sEM As String = ""
        Dim sSkiYr As String = 0
        If Regex.IsMatch(sInput, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
            System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: SANCTION branch - " & sInput)
            ' Sanction number - redirect as before
            Response.Redirect("Tournament.aspx?SN=" & sInput & "&FM=1&SY=0")
            Exit Sub
        End If

        System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: KEYWORD branch - " & sInput)
        ' Otherwise treat as keyword search
        Dim sResultsHtml As String = ModDataAccess3.SearchTournamentsByKeyword(sInput)
        If sResultsHtml.Contains("No tournaments found") Then
            System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: NO RESULTS for " & sInput)
            Lbl_TournamentErrors.Text = "No tournaments found matching your search."
            TList.InnerHtml = ""
            Exit Sub
        End If

        ' Count number of matches by counting <tr> tags (excluding header if any)
        Dim matchCount As Integer = (sResultsHtml.Length - sResultsHtml.Replace("<tr>", "").Length) / 4
        System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: matchCount=" & matchCount)
        If matchCount = 1 Then
            ' Extract sanction number from the only row
            Dim rx As New Regex("Tournament.aspx\?SN=([0-9][0-9][CEMSWUX][0-9][0-9][0-9])")
            Dim m As Match = rx.Match(sResultsHtml)
            If m.Success Then
                System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: SINGLE MATCH - " & m.Groups(1).Value)
                Response.Redirect("Tournament.aspx?SN=" & m.Groups(1).Value & "&FM=1&SY=0")
                Exit Sub
            End If
        End If

        ' Multiple matches: show table in TList
        System.Diagnostics.Debug.WriteLine("[LWS-LOG] Btn_SanctionID_Click: MULTIPLE MATCHES")
        TList.InnerHtml = sResultsHtml
        Lbl_TournamentErrors.Text = ""
    End Sub
End Class