Imports System.Text.RegularExpressions
Imports System.Web.Script.Serialization

Public Class GetLeaderboardSP
    Inherits System.Web.UI.Page

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        ' Set content type for JSON response
        Response.ContentType = "application/json"
        Response.Clear()


        Dim jsonResponse As String = ""
        Dim startTime As DateTime = DateTime.Now

        Try
            ' Get and validate parameters - same as TLeaderBoardSP
            Dim sSanctionID As String = Request("SID")
            Dim sYrPkd As String = Request("SY")
            Dim sTournName As String = Request("TN")
            Dim sFormatCode As String = Request("FC")
            Dim sEventCodePkd As String = Request("EV")
            Dim sDivisionCodePkd As String = Request("DV")
            Dim sRndsPkd As String = Request("RND")
            Dim sUseNOPS As String = Request("UN")
            Dim sUseTeams As String = Request("UT")
            Dim sFromTournament As String = Request("FT")
            Dim sGetMostRecent As String = Request("GET_MOST_RECENT")
            Dim sLoadAllDivisions As String = Request("LOAD_ALL_DIVISIONS")
            Dim sBatchDivisions As String = Request("BATCH_DIVISIONS")
            Dim sForcePlacement As String = Request("FORCE_PLACEMENT")
            Dim sGetRecentScores As String = Request("GET_RECENT_SCORES")
            Dim sGetRunningOrder As String = Request("GET_RUNNING_ORDER")
            Dim sGetByDivision As String = Request("GET_BY_DIVISION")

            ' Validate required parameters
            If String.IsNullOrEmpty(sSanctionID) OrElse String.IsNullOrEmpty(sYrPkd) OrElse
               String.IsNullOrEmpty(sTournName) OrElse String.IsNullOrEmpty(sFormatCode) Then
                OutputJsonError("Invalid Request. Missing required parameters.")
                Exit Sub
            End If

            ' Validate format - same validation as TLeaderBoardSP
            If Not Regex.IsMatch(sSanctionID, "^[0-9][0-9][CEMSWUX][0-9][0-9][0-9]$") Then
                OutputJsonError("Invalid Request. You may try again.")
                Exit Sub
            End If

            If sYrPkd <> "0" AndAlso Not Regex.IsMatch(sYrPkd, "^[2-9][0-9]$") Then
                OutputJsonError("Invalid Request. You may try again.")
                Exit Sub
            End If

            ' Check if this is a collegiate tournament (NCWL) or regular tournament (LBSP)
            Dim isCollegiate As Boolean = (sFormatCode = "NCWL")

            If sFormatCode <> "LBSP" And sFormatCode <> "NCWL" Then
                OutputJsonError("Invalid Request. You may try again.")
                Exit Sub
            End If

            ' Get tournament specifications - same as TLeaderBoardSP
            Dim sArrSpecs = ModDataAccess.GetTournamentSpecs(sSanctionID)
            If Left(sArrSpecs(0, 0), 5) = "Error" Then
                OutputJsonError(sArrSpecs(0, 0))
                Exit Sub
            End If

            ' Get event rounds
            Dim sSlalomRounds As Int16 = 0
            Dim sTrickRounds As Int16 = 0
            Dim sJumpRounds As Int16 = 0

            If sArrSpecs(6, 2) > 0 Then sSlalomRounds = sArrSpecs(6, 2)
            If sArrSpecs(7, 2) > 0 Then sTrickRounds = sArrSpecs(7, 2)
            If sArrSpecs(8, 2) > 0 Then sJumpRounds = sArrSpecs(8, 2)

            ' Set display metric based on rules
            Dim sDisplayMetric As Int16 = 0
            Select Case UCase(sArrSpecs(5, 2))
                Case "AWSA", "NCWSA"
                    sDisplayMetric = 0
                Case "IWWF"
                    sDisplayMetric = 1
                Case Else
                    sDisplayMetric = 0
            End Select

            ' Get most recent divisions by activity
            If sGetMostRecent = "1" Then
                ' Use event code if provided, otherwise get from all events
                Dim eventCodeForRecent As String = If(String.IsNullOrEmpty(sEventCodePkd), "A", sEventCodePkd)
                Dim recentDivs = ModDataAccess3.GetDvMostRecent(sSanctionID, eventCodeForRecent)
                Dim serializer As New JavaScriptSerializer()
                jsonResponse = serializer.Serialize(New With {
                    .success = True,
                    .prioritizedDivisions = recentDivs
                })
                ' Return all divisions from all events 
            ElseIf sLoadAllDivisions = "1" Then
                Dim allDivisions As New List(Of Object)

                ' Load divisions from each event and combine them
                Dim slalomDivs = ModDataAccess3.LoadDvData(sSanctionID, "S")
                Dim trickDivs = ModDataAccess3.LoadDvData(sSanctionID, "T")
                Dim jumpDivs = ModDataAccess3.LoadDvData(sSanctionID, "J")

                ' Add all divisions to combined list
                allDivisions.AddRange(slalomDivs)
                allDivisions.AddRange(trickDivs)
                allDivisions.AddRange(jumpDivs)

                Dim serializer As New JavaScriptSerializer()
                jsonResponse = serializer.Serialize(New With {
                    .success = True,
                    .availableDivisions = allDivisions
                })
                ' Return recent scores from all events
            ElseIf sGetRecentScores = "1" Then
                ' Use dynamic hours parameter from frontend, default to 10
                Dim hoursBack As Integer = 10
                If Not String.IsNullOrEmpty(Request("HOURS_BACK")) Then
                    Integer.TryParse(Request("HOURS_BACK"), hoursBack)
                End If
                
                Dim recentScores = ModDataAccess3.GetRecentScores(sSanctionID, 20, hoursBack)
                Dim serializer As New JavaScriptSerializer()
                jsonResponse = serializer.Serialize(New With {
                    .success = True,
                    .recentScores = recentScores
                })
                ' Load multiple divisions using multiple calls to LeaderBoardBestRndLeftSP
            ElseIf Not String.IsNullOrEmpty(sBatchDivisions) Then
                Dim serializer As New JavaScriptSerializer()
                Dim batchRequests = serializer.Deserialize(Of List(Of Dictionary(Of String, Object)))(sBatchDivisions)

                ' Call LeaderBoardBestRndLeftSP for each division
                Dim batchResults As New List(Of Object)
                For j As Integer = 0 To batchRequests.Count - 1
                    Dim request = batchRequests(j)
                    Dim eventCode As String = request("event").ToString()
                    Dim divisionCode As String = request("division").ToString()

                    Try

                        ' Use BuildLeaderboardJson to get the same logic as single division processing
                        Dim jsonResult As String = BuildLeaderboardJson(sSanctionID, sYrPkd, sTournName, eventCode, divisionCode, sRndsPkd, sSlalomRounds, sTrickRounds, sJumpRounds, CShort(CInt(sUseNOPS)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric, sForcePlacement)

                        ' Extract htmlContent and placementFormat from JSON response
                        Dim htmlContent As String = ""
                        Dim placementFormat As String = "ROUND"
                        Try
                            Dim tempSerializer As New JavaScriptSerializer()
                            Dim tempResult = tempSerializer.DeserializeObject(jsonResult)
                            Dim tempDict = CType(tempResult, Dictionary(Of String, Object))
                            If tempDict.ContainsKey("htmlContent") AndAlso tempDict("htmlContent") IsNot Nothing Then
                                htmlContent = tempDict("htmlContent").ToString()
                            End If
                            If tempDict.ContainsKey("placementFormat") AndAlso tempDict("placementFormat") IsNot Nothing Then
                                placementFormat = tempDict("placementFormat").ToString()
                            End If
                        Catch
                            htmlContent = "Error processing division data"
                        End Try

                        batchResults.Add(New With {
                            .event = eventCode,
                            .division = divisionCode,
                            .success = True,
                            .htmlContent = htmlContent,
                            .placementFormat = placementFormat
                        })
                    Catch ex As Exception
                        batchResults.Add(New With {
                            .event = eventCode,
                            .division = divisionCode,
                            .success = False,
                            .htmlContent = "Error loading division data",
                            .placementFormat = "ROUND"
                        })
                    End Try
                Next

                jsonResponse = serializer.Serialize(New With {
                    .success = True,
                    .batchResults = batchResults
                })
                ' If no event specified, return tournament info and available options
            ElseIf String.IsNullOrEmpty(sEventCodePkd) OrElse sEventCodePkd = "0" Then
                jsonResponse = BuildTournamentInfoJson(sSanctionID, sTournName, sSlalomRounds, sTrickRounds, sJumpRounds, sFormatCode)
            ElseIf sGetRunningOrder = "1" Then
                ' Return running order data
                jsonResponse = BuildRunningOrderJson(sSanctionID, sYrPkd, sTournName, sEventCodePkd, sDivisionCodePkd, sRndsPkd, sSlalomRounds, sTrickRounds, sJumpRounds, CShort(CInt(sUseNOPS)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
            ElseIf sGetByDivision = "1" Then
                ' Return by division view data
                jsonResponse = BuildByDivisionJson(sSanctionID, sYrPkd, sTournName, sEventCodePkd, sDivisionCodePkd, sRndsPkd, sSlalomRounds, sTrickRounds, sJumpRounds, CShort(CInt(sUseNOPS)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
            ElseIf String.IsNullOrEmpty(sDivisionCodePkd) Then
                ' Event specified but no division - return just division data quickly
                jsonResponse = BuildDivisionInfoJson(sSanctionID, sEventCodePkd)
            Else
                ' Return leaderboard data
                jsonResponse = BuildLeaderboardJson(sSanctionID, sYrPkd, sTournName, sEventCodePkd, sDivisionCodePkd, sRndsPkd, sSlalomRounds, sTrickRounds, sJumpRounds, CShort(CInt(sUseNOPS)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric, sForcePlacement)
            End If

        Catch ex As Exception
            OutputJsonError("An error occurred processing your request.")
            Exit Sub
        End Try


        Response.Write(jsonResponse)
        Response.End()
    End Sub

    Private Function BuildTournamentInfoJson(sSanctionID As String, sTournName As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sFormatCode As String) As String
        Dim info As New With {
            .success = True,
            .tournamentName = sTournName,
            .sanctionId = sSanctionID,
            .formatCode = sFormatCode,
            .availableEvents = New List(Of Object),
            .availableDivisions = New List(Of Object),
            .availableRounds = New List(Of Object),
            .onWaterData = GetOnWaterData(sSanctionID, sSlalomRounds, sTrickRounds, sJumpRounds)
        }

        ' Add available events
        If sSlalomRounds > 0 Then info.availableEvents.Add(New With {.code = "S", .name = "Slalom", .rounds = sSlalomRounds})
        If sTrickRounds > 0 Then info.availableEvents.Add(New With {.code = "T", .name = "Trick", .rounds = sTrickRounds})
        If sJumpRounds > 0 Then info.availableEvents.Add(New With {.code = "J", .name = "Jump", .rounds = sJumpRounds})

        ' Add Overall if there are multiple events (Overall combines all events)
        Dim eventCount As Integer = 0
        If sSlalomRounds > 0 Then eventCount += 1
        If sTrickRounds > 0 Then eventCount += 1
        If sJumpRounds > 0 Then eventCount += 1

        If eventCount > 1 Then
            Dim maxRounds As Integer = Math.Max(Math.Max(sSlalomRounds, sTrickRounds), sJumpRounds)
            info.availableEvents.Add(New With {.code = "O", .name = "Overall", .rounds = maxRounds})
        End If

        ' Get available divisions using new LoadDvData function
        info.availableDivisions = ModDataAccess3.LoadDvData(sSanctionID, "")

        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(info)
    End Function

    Private Function BuildDivisionInfoJson(sSanctionID As String, sEventCodePkd As String) As String
        Dim info As New With {
            .success = True,
            .availableDivisions = ModDataAccess3.LoadDvData(sSanctionID, sEventCodePkd)
        }

        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(info)
    End Function

    Private Function BuildLeaderboardJson(sSanctionID As String, sYrPkd As String, sTournName As String, sEventCodePkd As String, sDivisionCodePkd As String, sRndsPkd As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sUseNops As Int16, sUseTeams As Int16, sFormatCode As String, sDisplayMetric As Int16, Optional sForcePlacement As String = "") As String
        Dim sHtmlContent As String = ""
        Dim sPlcmntFormat As String = ""

        ' Check if this is a collegiate tournament
        Dim isCollegiate As Boolean = (sFormatCode = "NCWL")

        ' Get on-water data
        Dim onWaterData = GetOnWaterData(sSanctionID, sSlalomRounds, sTrickRounds, sJumpRounds)

        ' Generate leaderboard HTML using same logic as TLeaderBoardSP
        Dim dbStartTime As DateTime = DateTime.Now
        Select Case sEventCodePkd
            Case "S"
                sPlcmntFormat = ModDataAccessPro.GetPlcmtFormat(sSanctionID, "Slalom")
                ' Override placement format if forced
                If Not String.IsNullOrEmpty(sForcePlacement) Then
                    sPlcmntFormat = sForcePlacement
                End If
                ' Use LeaderBoardROUND only if placement format is ROUND (match TLeaderBoardSP logic exactly)
                If UCase(sPlcmntFormat) = "ROUND" Then
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardROUND(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                Else
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardBestRndLeftSP(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                End If
            Case "T"
                sPlcmntFormat = ModDataAccessPro.GetPlcmtFormat(sSanctionID, "Trick")
                ' Override placement format if forced
                If Not String.IsNullOrEmpty(sForcePlacement) Then
                    sPlcmntFormat = sForcePlacement
                End If
                ' Use LeaderBoardROUND only if placement format is ROUND (match TLeaderBoardSP logic exactly)
                If UCase(sPlcmntFormat) = "ROUND" Then
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardROUND(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                Else
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardBestRndLeftSP(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                End If
            Case "J"
                sPlcmntFormat = ModDataAccessPro.GetPlcmtFormat(sSanctionID, "Jump")
                ' Override placement format if forced
                If Not String.IsNullOrEmpty(sForcePlacement) Then
                    sPlcmntFormat = sForcePlacement
                End If
                ' Use LeaderBoardROUND only if placement format is ROUND (match TLeaderBoardSP logic exactly)
                If UCase(sPlcmntFormat) = "ROUND" Then
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardROUND(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                Else
                    If isCollegiate Then
                        sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.LeaderBoardBestRndLeftSP(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                    End If
                End If
            Case "O"
                ' Overall always uses BestRndLeftSP since it doesn't have round-specific scoring
                If isCollegiate Then
                    sHtmlContent = ModDataAccessTeams.LeaderBoardBestRndLeft(sSanctionID, sYrPkd, sTournName, "O", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                Else
                    sHtmlContent = ModDataAccess3.LeaderBoardBestRndLeftSP(sSanctionID, sYrPkd, sTournName, "O", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), CShort(CInt(sUseNops)), CShort(CInt(sUseTeams)), sFormatCode, sDisplayMetric)
                End If
        End Select

        ' Log database time  
        Dim dbTime As TimeSpan = DateTime.Now - dbStartTime

        Dim result As New With {
            .success = True,
            .htmlContent = sHtmlContent,
            .onWaterData = onWaterData,
            .eventCode = sEventCodePkd,
            .divisionCode = sDivisionCodePkd,
            .roundCode = sRndsPkd,
            .placementFormat = sPlcmntFormat,
            .availableDivisions = ModDataAccess3.LoadDvData(sSanctionID, sEventCodePkd)
        }

        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(result)
    End Function

    Private Function BuildRunningOrderJson(sSanctionID As String, sYrPkd As String, sTournName As String, sEventCodePkd As String, sDivisionCodePkd As String, sRndsPkd As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sUseNops As Int16, sUseTeams As Int16, sFormatCode As String, sDisplayMetric As Int16) As String
        Dim sHtmlContent As String = ""
        
        ' Ensure round parameter is properly formatted (empty string should be "0")
        If String.IsNullOrEmpty(sRndsPkd) Then sRndsPkd = "0"
        
        ' Get running order count to determine if multi or single running order is needed
        Dim sRunOrdCountArray(0 To 4)
        sRunOrdCountArray = ModDataAccess3.GetRunOrdercount(sSanctionID, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds))
        
        If Left(sRunOrdCountArray(0), 5) = "Error" Then
            sHtmlContent = sRunOrdCountArray(0)
        Else
            Dim sMultiS As String = sRunOrdCountArray(1)
            Dim sMultiT As String = sRunOrdCountArray(2) 
            Dim sMultiJ As String = sRunOrdCountArray(3)
            
            ' Generate running order HTML based on event and multi/single running order
            Select Case sEventCodePkd
                Case "S"
                    If sMultiS = "1" Then
                        sHtmlContent = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.ScoresXRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "S", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    End If
                Case "T"
                    If sMultiT = "1" Then
                        sHtmlContent = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.ScoresXRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "T", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    End If
                Case "J"
                    If sMultiJ = "1" Then
                        sHtmlContent = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    Else
                        sHtmlContent = ModDataAccess3.ScoresXRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "J", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    End If
                Case "O"
                    ' Overall always uses single running order
                    sHtmlContent = ModDataAccess3.ScoresXRunOrdHoriz(sSanctionID, sYrPkd, sTournName, "O", sDivisionCodePkd, sRndsPkd, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
            End Select
        End If
        
        ' Get on-water data
        Dim onWaterData = GetOnWaterData(sSanctionID, sSlalomRounds, sTrickRounds, sJumpRounds)
        
        Dim result As New With {
            .success = True,
            .htmlContent = sHtmlContent,
            .onWaterData = onWaterData,
            .eventCode = sEventCodePkd,
            .divisionCode = sDivisionCodePkd,
            .roundCode = sRndsPkd,
            .displayType = "RUNNING_ORDER",
            .availableDivisions = ModDataAccess3.LoadDvData(sSanctionID, sEventCodePkd)
        }
        
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(result)
    End Function

    Private Function BuildByDivisionJson(sSanctionID As String, sYrPkd As String, sTournName As String, sEventCodePkd As String, sDivisionCodePkd As String, sRndsPkd As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sUseNops As Int16, sUseTeams As Int16, sFormatCode As String, sDisplayMetric As Int16) As String
        Dim sHtmlContent As String = ""
        
        ' Determine which case we're in based on parameters
        Dim hasEvent As Boolean = Not String.IsNullOrEmpty(sEventCodePkd) AndAlso sEventCodePkd <> "0"
        Dim hasDivision As Boolean = Not String.IsNullOrEmpty(sDivisionCodePkd) AndAlso sDivisionCodePkd <> "ALL"
        Dim hasRound As Boolean = Not String.IsNullOrEmpty(sRndsPkd) AndAlso sRndsPkd <> "0"
        
        ' Case 1: No division selected - return simple message
        If Not hasDivision Then
            sHtmlContent = "<div class='text-center p-4 text-muted'><p>Select a division to load information</p></div>"
        Else
            ' Cases 2-5: Generate running order + leaderboard pairs
            sHtmlContent = BuildByDivisionContent(sSanctionID, sYrPkd, sTournName, sEventCodePkd, sDivisionCodePkd, sRndsPkd, sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric, hasEvent, hasRound)
        End If
        
        ' Get on-water data
        Dim onWaterData = GetOnWaterData(sSanctionID, sSlalomRounds, sTrickRounds, sJumpRounds)
        
        Dim result As New With {
            .success = True,
            .htmlContent = sHtmlContent,
            .onWaterData = onWaterData,
            .eventCode = sEventCodePkd,
            .divisionCode = sDivisionCodePkd,
            .roundCode = sRndsPkd,
            .displayType = "BY_DIVISION",
            .availableDivisions = ModDataAccess3.LoadDvData(sSanctionID, sEventCodePkd)
        }
        
        Dim serializer As New JavaScriptSerializer()
        Return serializer.Serialize(result)
    End Function

    Private Function BuildByDivisionContent(sSanctionID As String, sYrPkd As String, sTournName As String, sEventCodePkd As String, sDivisionCodePkd As String, sRndsPkd As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sUseNops As Int16, sUseTeams As Int16, sFormatCode As String, sDisplayMetric As Int16, hasEvent As Boolean, hasRound As Boolean) As String
        Dim sHtmlContent As String = ""
        
        ' Determine which events to show
        Dim eventsToShow As New List(Of String)
        If hasEvent Then
            eventsToShow.Add(sEventCodePkd)
        Else
            ' Show all events that have rounds
            If sSlalomRounds > 0 Then eventsToShow.Add("S")
            If sTrickRounds > 0 Then eventsToShow.Add("T")  
            If sJumpRounds > 0 Then eventsToShow.Add("J")
        End If
        
        ' Determine which rounds to show for each event
        sHtmlContent = "<div class='by-division-content'>"
        sHtmlContent += "<h3>Division " & sDivisionCodePkd & " - Running Order & Leaderboards by Round</h3>"
        
        For Each eventCode As String In eventsToShow
            Dim maxRounds As Integer = 0
            Select Case eventCode
                Case "S"
                    maxRounds = sSlalomRounds
                Case "T"
                    maxRounds = sTrickRounds
                Case "J"
                    maxRounds = sJumpRounds
            End Select
            
            If maxRounds > 0 Then
                sHtmlContent += "<h4>" & GetEventName(eventCode) & "</h4>"
                
                ' Show specific round or all rounds
                If hasRound Then
                    Dim roundNum As Integer = CInt(sRndsPkd)
                    If roundNum <= maxRounds Then
                        sHtmlContent += BuildRoundContent(sSanctionID, sYrPkd, sTournName, eventCode, sDivisionCodePkd, roundNum.ToString(), sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    End If
                Else
                    ' Show all rounds for this event
                    For round As Integer = 1 To maxRounds
                        sHtmlContent += BuildRoundContent(sSanctionID, sYrPkd, sTournName, eventCode, sDivisionCodePkd, round.ToString(), sSlalomRounds, sTrickRounds, sJumpRounds, sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                    Next
                End If
            End If
        Next
        
        sHtmlContent += "</div>"
        Return sHtmlContent
    End Function

    Private Function BuildRoundContent(sSanctionID As String, sYrPkd As String, sTournName As String, eventCode As String, divisionCode As String, roundNum As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16, sUseNops As Int16, sUseTeams As Int16, sFormatCode As String, sDisplayMetric As Int16) As String
        Dim content As String = ""
        
        ' Create side-by-side layout for running order and leaderboard
        content += "<div class='round-pair-container' style='display: flex; gap: 2rem; margin: 1rem 0;'>"
        
        ' Left side: Running Order
        content += "<div class='running-order-section' style='flex: 1;'>"
        content += "<h5>Round " & roundNum & " - Running Order</h5>"
        
        ' Get running order count to determine if multi or single running order is needed
        Dim sRunOrdCountArray(0 To 4)
        sRunOrdCountArray = ModDataAccess3.GetRunOrdercount(sSanctionID, "0", "0", "0")
        
        Try
            Dim runningOrderHtml As String = ""
            If Left(sRunOrdCountArray(0), 5) <> "Error" Then
                Dim sMulti As String = ""
                Select Case eventCode
                    Case "S"
                        sMulti = sRunOrdCountArray(1)
                    Case "T"
                        sMulti = sRunOrdCountArray(2) 
                    Case "J"
                        sMulti = sRunOrdCountArray(3)
                End Select
                
                ' Call appropriate running order function with proper round parameters
                If sMulti = "1" Then
                    runningOrderHtml = ModDataAccess3.ScoresXMultiRunOrdHoriz(sSanctionID, sYrPkd, sTournName, eventCode, divisionCode, roundNum, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                Else
                    runningOrderHtml = ModDataAccess3.ScoresXRunOrdHoriz(sSanctionID, sYrPkd, sTournName, eventCode, divisionCode, roundNum, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
                End If
            End If
            
            If String.IsNullOrEmpty(runningOrderHtml) Then
                content += "<p>Running order not available</p>"
            Else
                content += runningOrderHtml
            End If
        Catch ex As Exception
            content += "<p>Running order error: " & ex.Message & "</p>"
        End Try
        
        content += "</div>"
        
        ' Right side: Leaderboard (by round)
        content += "<div class='leaderboard-section' style='flex: 1;'>"
        content += "<h5>Round " & roundNum & " - Leaderboard</h5>"
        
        ' Get leaderboard BY ROUND using LeaderBoardROUND function
        Try
            Dim leaderboardHtml As String = ModDataAccess3.LeaderBoardROUND(sSanctionID, sYrPkd, sTournName, eventCode, divisionCode, roundNum, CStr(sSlalomRounds), CStr(sTrickRounds), CStr(sJumpRounds), sUseNops, sUseTeams, sFormatCode, sDisplayMetric)
            
            If String.IsNullOrEmpty(leaderboardHtml) Then
                content += "<p>Leaderboard not available</p>"
            Else
                content += leaderboardHtml
            End If
        Catch ex As Exception
            content += "<p>Leaderboard error: " & ex.Message & "</p>"
        End Try
        
        content += "</div>"
        content += "</div>" ' Close round-pair-container
        
        Return content
    End Function

    Private Function GetEventName(eventCode As String) As String
        Select Case eventCode
            Case "S"
                Return "Slalom"
            Case "T"
                Return "Trick"
            Case "J"
                Return "Jump"
            Case "O"
                Return "Overall"
            Case Else
                Return "Event"
        End Select
    End Function

    Private Function GetOnWaterData(sSanctionID As String, sSlalomRounds As Int16, sTrickRounds As Int16, sJumpRounds As Int16) As Object
        Dim sActiveEvent As String = ModDataAccess3.GetCurrentEvent(sSanctionID, -15)

        If Left(sActiveEvent, 5) = "Error" OrElse sActiveEvent = "" Then
            Return New With {.activeEvent = "", .slalomOnWater = "", .trickOnWater = "", .jumpOnWater = ""}
        End If

        Dim sOWSlalom As String = ""
        Dim sOWTrick As String = ""
        Dim sOWJump As String = ""

        If sSlalomRounds > 0 Then
            sOWSlalom = ModDataAccess3.LoadOnWaterSlalom(sSanctionID)
            If Left(sOWSlalom, 2) = "No" Then sOWSlalom = ""
        End If

        If sTrickRounds > 0 Then
            sOWTrick = ModDataAccess3.LoadOnWaterTrick(sSanctionID)
            If Left(sOWTrick, 2) = "No" Then sOWTrick = ""
        End If

        If sJumpRounds > 0 Then
            sOWJump = ModDataAccess3.LoadOnWaterJump(sSanctionID)
            If Left(sOWJump, 2) = "No" Then sOWJump = ""
        End If

        Return New With {
            .activeEvent = sActiveEvent,
            .slalomOnWater = sOWSlalom,
            .trickOnWater = sOWTrick,
            .jumpOnWater = sOWJump
        }
    End Function

    Private Sub OutputJsonError(message As String)
        Dim errorResponse As New With {.success = False, .error = message}
        Dim serializer As New JavaScriptSerializer()
        Response.Write(serializer.Serialize(errorResponse))
        Response.End()
    End Sub
End Class